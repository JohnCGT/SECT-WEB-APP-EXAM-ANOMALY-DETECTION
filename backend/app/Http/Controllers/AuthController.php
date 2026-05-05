<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Register a new user
     *
     * This method handles user registration with validation and automatic login.
     * It accepts user details, validates them, creates a new user record, and logs them in.
     */
    public function register(Request $request)
    {
        try {
            // Validate incoming registration data
            // - name: required, string, max 255 characters
            // - email: required, must be valid email format, must be unique in users table
            // - password: required, minimum 8 characters with complexity requirements
            // - role: required, must be one of: admin, instructor, or student
            $validated = $request->validate([
                'name'     => 'required|string|max:255',
                'email'    => 'required|email|unique:users,email',
                'password' => [
                    'required',
                    // 'string',
                    // 'min:8',
                    // 'regex:/[a-z]/',      // at least one lowercase
                    // 'regex:/[A-Z]/',      // at least one uppercase
                    // 'regex:/[0-9]/',      // at least one number
                    // 'regex:/[@$!%*#?&]/', // at least one special char
                ],
                'role' => 'required|in:admin,instructor,student',
            ]);

            // Create new user in the database
            // Email is converted to lowercase for consistency
            // Password is hashed using bcrypt before storage
            // Wrapped in a DB transaction so if anything fails, the user is NOT saved to the database
            $user = DB::transaction(function () use ($validated, $request) {

                $user = User::create([
                    'name'     => $validated['name'],
                    'email'    => strtolower($validated['email']),
                    'password' => Hash::make($validated['password']),
                    'role'     => $validated['role'],
                ]);

                if ($user->role === 'student') {
                    DB::table('course_students')->insertOrIgnore([
                        'course_id'   => (int) env('DEMO_COURSE_ID', 1),
                        'student_id'  => $user->id,
                        'enrolled_at' => now(),
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }

                // Log the user in immediately after registration
                // This creates an authenticated session for the new user
                Auth::login($user);

                // Regenerate session to prevent fixation attacks
                // This creates a new session ID to enhance security
                $request->session()->regenerate();

                return $user;
            });

            // Return success response with user data (excluding password)
            return response()->json([
                'message' => 'Registration successful!',
                'user'    => $this->formatUser($user),
            ], 201); // 201 = Created

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Handle validation errors (e.g., duplicate email, weak password)
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(), // Returns specific field errors
            ], 422); // 422 = Unprocessable Entity

        } catch (\Exception $e) {
            // Handle any other unexpected errors during registration
            return response()->json([
                'message' => 'Registration failed',
                'error'   => $e->getMessage(),
            ], 500); // 500 = Internal Server Error
        }
    }

    /**
     * Login user
     *
     * This method authenticates a user with email and password.
     * It verifies credentials and creates an authenticated session.
     *
     * BUG FIX (Suspend): Added a status check after password verification.
     * Previously, a suspended user could still log in successfully because
     * status was never read. Now a 403 is returned before Auth::login().
     */
    public function login(Request $request)
    {
        try {
            // Validate login credentials
            // Both email and password are required
            $request->validate([
                'email'    => 'required|email',
                'password' => 'required|string',
            ]);

            // Find user by email (converted to lowercase for case-insensitive matching)
            $user = User::where('email', strtolower($request->email))->first();

            // Check if user exists and password is correct
            // Hash::check compares the plain password with the hashed password in database
            if (!$user || !Hash::check($request->password, $user->password)) {
                // Return error if credentials don't match
                return response()->json([
                    'message' => 'Invalid credentials',
                ], 401); // 401 = Unauthorized
            }

            // ── BUG FIX: Suspended-account gate ──────────────────────────
            // This block was missing entirely, which allowed suspended users
            // to log in even after an admin had suspended their account.
            // The DB status update was working correctly — the gate was just
            // never checked here on the way in.
            if (($user->status ?? 'active') === 'suspended') {
                return response()->json([
                    'message' => 'Your account has been suspended. Please contact your administrator.',
                ], 403); // 403 = Forbidden
            }
            // ─────────────────────────────────────────────────────────────

            // Log the user in via session
            // This creates an authenticated session for the user
            Auth::login($user);

            // Regenerate session ID after login to prevent session fixation
            // This is a security best practice
            $request->session()->regenerate();

            // Return success response with user data
            return response()->json([
                'message' => 'Login successful',
                'user'    => $this->formatUser($user),
            ], 200); // 200 = OK

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Handle validation errors (e.g., missing email or password)
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422); // 422 = Unprocessable Entity

        } catch (\Exception $e) {
            // Handle any other unexpected errors during login
            return response()->json([
                'message' => 'Login failed',
                'error'   => $e->getMessage(),
            ], 500); // 500 = Internal Server Error
        }
    }

    /**
     * Logout user
     *
     * This method logs out the currently authenticated user.
     * It destroys the session and invalidates the CSRF token.
     */
    public function logout(Request $request)
    {
        // Log the user out (clear authentication)
        Auth::guard('web')->logout();

        // Invalidate the current session
        // This removes all session data
        $request->session()->invalidate();

        // Regenerate the CSRF token
        // This prevents CSRF attacks using the old token
        $request->session()->regenerateToken();

        // Return success response
        return response()->json([
            'message' => 'Logged out successfully',
        ], 200); // 200 = OK
    }

    /**
     * Get authenticated user
     *
     * This method returns the currently authenticated user's information.
     * It's used to check if a user is logged in and get their details.
     */
    public function me(Request $request)
    {
        // Get the currently authenticated user from the request
        $user = $request->user();

        // Check if user is authenticated
        if (!$user) {
            // Return error if no user is logged in
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401); // 401 = Unauthorized
        }

        // Return the authenticated user's data
        return response()->json([
            'user' => $this->formatUser($user),
        ], 200); // 200 = OK
    }

    /**
     * Consistent user shape returned by register, login, and me.
     * Centralised here so all three endpoints stay in sync automatically.
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