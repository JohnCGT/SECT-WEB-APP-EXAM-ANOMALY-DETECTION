<?php

// backend/app/Http/Controllers/AdminProfileController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminProfileController extends Controller
{
    private function authorizeAdmin(): void
    {
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            abort(403, 'Forbidden: Admins only.');
        }
    }

    /**
     * GET /api/admin/profile
     * Returns the authenticated admin's profile.
     */
    public function show()
    {
        $this->authorizeAdmin();
        $u = auth()->user();

        return response()->json([
            'profile' => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'status'     => $u->status ?? 'active',
                'created_at' => $u->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * PATCH /api/admin/profile
     * Update name, email, and optionally password.
     *
     * Body: { name, email, current_password?, new_password? }
     */
    public function update(Request $request)
    {
        $this->authorizeAdmin();
        $user = auth()->user();

        $rules = [
            'name'  => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
        ];

        // Only validate password fields if the user is trying to change the password
        if ($request->filled('new_password')) {
            $rules['current_password'] = 'required|string';
            $rules['new_password']     = [
                'required', 'string', 'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ];
        }

        $validated = $request->validate($rules, [
            'new_password.regex' => 'Password must include uppercase, lowercase, number, and special character (@$!%*#?&).',
        ]);

        // If changing password, verify current password first
        if ($request->filled('new_password')) {
            if (!Hash::check($request->input('current_password'), $user->password)) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors'  => ['current_password' => ['Current password is incorrect.']],
                ], 422);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->name  = $validated['name'];
        $user->email = strtolower($validated['email']);
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'profile' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }
}