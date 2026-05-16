<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Register a new user.
     * Validates input, creates the user, auto-enrolls students into the demo course,
     * logs them in, and records an activity log entry — all inside a DB transaction.
     */
    public function register(Request $request)
    {
        try {
            // name: required | email: unique | password: required | role: admin/instructor/student
            $validated = $request->validate([
                'name'     => 'required|string|max:255',
                'email'    => 'required|email|unique:users,email',
                'password' => [
                    'required',
                    // 'string', 'min:8',
                    // 'regex:/[a-z]/', 'regex:/[A-Z]/',
                    // 'regex:/[0-9]/', 'regex:/[@$!%*#?&]/',
                ],
                'role'     => 'required|in:admin,instructor,student',
            ]);

            // Wrapped in a transaction — rolls back if anything fails
            $user = DB::transaction(function () use ($validated, $request) {

                $user = User::create([
                    'name'     => $validated['name'],
                    'email'    => strtolower($validated['email']),
                    'password' => Hash::make($validated['password']),
                    'role'     => $validated['role'],
                ]);

                // Auto-enroll new students into the demo course
                if ($user->role === 'student') {
                    DB::table('course_students')->insertOrIgnore([
                        'course_id'   => (int) env('DEMO_COURSE_ID', 1),
                        'student_id'  => $user->id,
                        'enrolled_at' => now(),
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }

                // Log in immediately after creation; regenerate session to prevent fixation
                Auth::login($user);
                $request->session()->regenerate();

                ActivityLog::record(
                    $user,
                    'register',
                    "{$user->name} registered a new {$user->role} account.",
                    ['role' => $user->role],
                    $request,
                    $user->id,
                    'User'
                );

                return $user;
            });

            return response()->json([
                'message' => 'Registration successful!',
                'user'    => $this->formatUser($user),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Authenticate a user.
     * Verifies credentials, blocks suspended accounts (BUG FIX), evicts any
     * existing session (one-device guard), then creates a fresh authenticated session.
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email'    => 'required|email',
                'password' => 'required|string',
            ]);

            $user = User::where('email', strtolower($request->email))->first();

            // Fail early if credentials are wrong
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            // BUG FIX: Suspended users were previously allowed to log in because
            // this status check was missing. Now returns 403 before Auth::login().
            if (($user->status ?? 'active') === 'suspended') {
                return response()->json([
                    'message' => 'Your account has been suspended. Please contact your administrator.',
                ], 403);
            }

            // One-device guard: evict any existing session before creating a new one,
            // preventing two roles from sharing the same session cookie.
            if (Auth::check()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            Auth::login($user);
            $request->session()->regenerate();

            ActivityLog::record(
                $user,
                'login',
                "{$user->name} logged in.",
                ['role' => $user->role],
                $request,
                $user->id,
                'User'
            );

            return response()->json([
                'message' => 'Login successful',
                'user'    => $this->formatUser($user),
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Log out the current user.
     * Records an activity log entry, destroys the session, and regenerates the CSRF token.
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            ActivityLog::record(
                $user,
                'logout',
                "{$user->name} logged out.",
                [],
                $request
            );
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully'], 200);
    }

    /**
     * Return the currently authenticated user, or 401 if unauthenticated.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json(['user' => $this->formatUser($user)], 200);
    }

    /**
     * Centralised user shape returned by register, login, and me.
     * Eager-loads enrollments (with instructor) only for students.
     */
    private function formatUser(User $user): array
    {
        if ($user->role === 'student') {
            $user->loadMissing('enrolledCourses.instructor');
        }

        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'role'              => $user->role,
            'status'            => $user->status ?? 'active',
            'phone'             => $user->phone,
            'course'            => $user->course,
            'year_level'        => $user->year_level,
            'student_id'        => $user->student_id ?? null,
            'profile_photo_url' => $user->profile_photo_url ?? null,
            'enrollments'       => $user->role === 'student'
                ? $user->enrolledCourses->map(fn($c) => [
                    'id'         => $c->id,
                    'code'       => $c->code,
                    'name'       => $c->name,
                    'instructor' => $c->instructor->name ?? null,
                    'status'     => 'Active',
                ])->values()->toArray()
                : [],
        ];
    }
}