<?php

// backend/app/Http/Controllers/AdminUserController.php

namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * GET /api/admin/users
     */
    public function index()
    {
        $this->authorizeAdmin();

        $users = User::orderByDesc('created_at')->get()->map(fn($u) => $this->format($u));

        return response()->json(['data' => $users], 200);
    }

    /**
     * POST /api/admin/users
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => [
                'required', 'string', 'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
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
                'course_id'   => env('DEMO_COURSE_ID'),
                'student_id'  => $user->id,
                'enrolled_at' => now(),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        // ── Activity Log ──────────────────────────────────────────────────
        ActivityLog::record(
            $request->user(),
            'admin.user_created',
            "Admin {$request->user()->name} registered \"{$user->name}\" as {$user->role}.",
            [
                'target_user_id'    => $user->id,
                'target_user_name'  => $user->name,
                'target_user_email' => $user->email,
                'role'              => $user->role,
            ],
            $request,
            $user->id,
            'User'
        );
        // ─────────────────────────────────────────────────────────────────

        return response()->json([
            'message' => 'User registered successfully.',
            'user'    => $this->format($user),
        ], 201);
    }

    /**
     * PUT /api/admin/users/{id}
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

        // ── Activity Log ──────────────────────────────────────────────────
        ActivityLog::record(
            $request->user(),
            'admin.user_updated',
            "Admin {$request->user()->name} updated user \"{$user->name}\".",
            [
                'target_user_id'    => $user->id,
                'target_user_name'  => $user->name,
                'target_user_email' => $user->email,
                'role'              => $user->role,
            ],
            $request,
            $user->id,
            'User'
        );
        // ─────────────────────────────────────────────────────────────────

        return response()->json([
            'message' => 'User updated successfully.',
            'user'    => $this->format($user),
        ], 200);
    }

    /**
     * PATCH /api/admin/users/{id}/status
     */
    public function updateStatus(Request $request, int $id)
    {
        $this->authorizeAdmin();

        $user = User::findOrFail($id);

        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot change status of an admin account.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,suspended',
        ]);

        $user->status = $validated['status'];
        $user->save();

        // ── Activity Log ──────────────────────────────────────────────────
        $action = $validated['status'] === 'suspended' ? 'suspended' : 'reactivated';
        ActivityLog::record(
            $request->user(),
            'admin.user_status_changed',
            "Admin {$request->user()->name} {$action} user \"{$user->name}\".",
            [
                'target_user_id'   => $user->id,
                'target_user_name' => $user->name,
                'new_status'       => $validated['status'],
            ],
            $request,
            $user->id,
            'User'
        );
        // ─────────────────────────────────────────────────────────────────

        return response()->json([
            'message' => 'User status updated.',
            'user'    => $this->format($user),
        ], 200);
    }

    /**
     * DELETE /api/admin/users/{id}
     */
    public function destroy(Request $request, int $id)
    {
        $this->authorizeAdmin();

        $user = User::findOrFail($id);

        if ($user->role === 'admin') {
            return response()->json(['message' => 'Admin accounts cannot be deleted via this panel.'], 403);
        }

        // ── Activity Log — BEFORE delete so we still have user data ───────
        ActivityLog::record(
            $request->user(),
            'admin.user_deleted',
            "Admin {$request->user()->name} deleted user \"{$user->name}\" ({$user->email}).",
            [
                'target_user_id'    => $user->id,
                'target_user_name'  => $user->name,
                'target_user_email' => $user->email,
                'role'              => $user->role,
            ],
            $request,
            $user->id,
            'User'
        );
        // ─────────────────────────────────────────────────────────────────

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.'], 200);
    }

    /* ─── Private helpers ─────────────────────────────────────────────── */

    private function authorizeAdmin(): void
    {
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            abort(403, 'Forbidden: Admins only.');
        }
    }

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