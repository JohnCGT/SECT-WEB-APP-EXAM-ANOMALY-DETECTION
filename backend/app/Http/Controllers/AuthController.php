<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Register a new user
     * Accepts: name, email, password, role
     * Returns: user data on success
     */
    public function register(Request $request)
    {
        try {
            // Validate incoming data
            $request->validate([
                'name' => 'required|string|max:255',           // Name is required
                'email' => 'required|email|unique:users,email', // Email must be unique
                'password' => 'required|string|min:8',         // Password min 8 chars
                'role' => 'required|in:admin,instructor,student', // Role must be one of these
            ]);

            // Create new user with hashed password
            $user = User::create([
                'name' => $request->name,                      // Store name as-is
                'email' => strtolower($request->email),        // Store email in lowercase
                'password' => Hash::make($request->password),  // Hash the password (bcrypt)
                'role' => $request->role,                      // Store role
            ]);

            // Return success response with user data
            return response()->json([
                'message' => 'Registration successful!',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ], 201); // 201 = Created

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Validation failed - return errors
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors() // Shows which fields failed
            ], 422); // 422 = Unprocessable Entity

        } catch (\Exception $e) {
            // Server error - return error message
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500); // 500 = Internal Server Error
        }
    }

    /**
     * Login user
     * Accepts: email, password
     * Returns: user data on success
     */
    public function login(Request $request)
    {
        try {
            // Validate input
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // Find user by email (case-insensitive)
            $user = User::where('email', strtolower($request->email))->first();

            // Check if user exists and password matches
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401); // 401 = Unauthorized
            }

            // Login successful - return user data
            return response()->json([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ], 200); // 200 = OK

        } catch (\Exception $e) {
            // Server error
            return response()->json([
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}