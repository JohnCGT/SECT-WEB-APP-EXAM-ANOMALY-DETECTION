<?php

// backend/app/Http/Controllers/AdminUserController.php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * GET /api/admin/users
     * List all users, newest first.
     * Admin-only.
     */
    public function index()
    {
        $this->authorizeAdmin();

        $users = User::orderByDesc('created_at')->get()->map(fn($u) => $this->format($u));

        return response()->json(['data' => $users], 200);
    }

    /**
     * POST /api/admin/users
     * Register a new user from the admin panel.
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => [
                'required', 'string', 'min:8',
                'regex:/[a-z]/',       // lowercase
                'regex:/[A-Z]/',       // uppercase
                'regex:/[0-9]/',       // digit
                'regex:/[@$!%*#?&]/', // special char
            ],
            'role'     => 'required|in:admin,instructor,student',
        ], [
            'password.regex' => 'Password must include uppercase, lowercase, number, and special character (@$!%*#?&).',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
            'status'   => 'active',
        ]);

        // Auto-enroll new students into the default demo course
        if ($user->role === 'student') {
            \Illuminate\Support\Facades\DB::table('course_students')->insert([
                'course_id'   => env('DEMO_COURSE_ID', 1),
                'student_id'  => $user->id,
                'enrolled_at' => now(),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        return response()->json([
            'message' => 'User registered successfully.',
            'user'    => $this->format($user),
        ], 201);
    }

    /**
     * PUT /api/admin/users/{id}
     * Update name, email, role, and optionally password.
     */
    public function update(Request $request, int $id)
    {
        $this->authorizeAdmin();

        $user = User::findOrFail($id);

        $rules = [
            'name'  => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($id)],
            'role'  => 'required|in:admin,instructor,student',
        ];

        // Password is optional on edit — only validate if provided
        if ($request->filled('password')) {
            $rules['password'] = [
                'string', 'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ];
        }

        $validated = $request->validate($rules, [
            'password.regex' => 'Password must include uppercase, lowercase, number, and special character (@$!%*#?&).',
        ]);

        $user->name  = $validated['name'];
        $user->email = strtolower($validated['email']);
        $user->role  = $validated['role'];

        if ($request->filled('password')) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'User updated successfully.',
            'user'    => $this->format($user),
        ], 200);
    }

    /**
     * PATCH /api/admin/users/{id}/status
     * Suspend or reactivate a user.
     * Body: { "status": "active" | "suspended" }
     */
    public function updateStatus(Request $request, int $id)
    {
        $this->authorizeAdmin();

        $user = User::findOrFail($id);

        // Prevent suspending other admins
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot change status of an admin account.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,suspended',
        ]);

        $user->status = $validated['status'];
        $user->save();

        return response()->json([
            'message' => 'User status updated.',
            'user'    => $this->format($user),
        ], 200);
    }

    /**
     * DELETE /api/admin/users/{id}
     * Permanently delete a user.
     */
    public function destroy(int $id)
    {
        $this->authorizeAdmin();

        $user = User::findOrFail($id);

        // Prevent self-deletion or deleting other admins
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Admin accounts cannot be deleted via this panel.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.'], 200);
    }

    /* ─── Private helpers ─────────────────────────────────────────────── */

    /** Throw 403 if the authenticated user is not an admin. */
    private function authorizeAdmin(): void
    {
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            abort(403, 'Forbidden: Admins only.');
        }
    }

    /** Return a consistent array shape for every user. */
    private function format(User $u): array
    {
        return [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'role'       => $u->role,
            'status'     => $u->status ?? 'active',
            'created_at' => $u->created_at?->toISOString(),
        ];
    }
}
