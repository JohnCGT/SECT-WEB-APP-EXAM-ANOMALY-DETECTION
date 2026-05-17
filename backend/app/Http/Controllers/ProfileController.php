<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Update general profile information.
     * PUT /profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email,' . $user->id,
            'phone'      => 'nullable|string|max:20',
            'course'     => 'nullable|string|max:255',
            'year_level' => 'nullable|string|max:50',
        ]);

        $user->update([
            'name'       => trim($validated['name']),
            'email'      => strtolower($validated['email']),
            'phone'      => $validated['phone']      ?? $user->phone,
            'course'     => $validated['course']     ?? $user->course,
            'year_level' => $validated['year_level'] ?? $user->year_level,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => $this->formatUser($user->fresh()),
        ]);
    }

    /**
     * Change password.
     * PUT /profile/password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password'         => [
                'required',
                'string',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => ['current_password' => ['Current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    private function formatUser($user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'role'              => $user->role,
            'phone'             => $user->phone,
            'course'            => $user->course,
            'year_level'        => $user->year_level,
            'student_id'        => $user->student_id ?? null,
            'profile_photo_url' => $user->profile_photo_url ?? null,
        ];
    }
}