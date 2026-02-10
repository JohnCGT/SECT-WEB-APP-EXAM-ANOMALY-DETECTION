<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Register with security
    public function register(Request $request)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'name' => 'required|string|max:255|min:2',
                'email' => 'required|email|max:255|unique:users,email',
                'password' => 'required|string|min:8|max:255',
                'role' => 'required|in:admin,instructor,student',
            ]);

            // Create user with hashed password
            $user = User::create([
                'name' => strip_tags($validated['name']), // XSS protection
                'email' => strtolower($validated['email']), // Normalize email
                'password' => Hash::make($validated['password']), // Bcrypt hashing
                'role' => $validated['role'],
            ]);

            // Create secure token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Registration successful!',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Login with rate limiting
    public function login(Request $request)
    {
        $email = $request->email;

        // Rate limiting: max 5 attempts per minute
        $key = 'login-attempts:' . $request->ip();
        
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        try {
            // Validate input
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            // Find user
            $user = User::where('email', strtolower($validated['email']))->first();

            // Check credentials
            if (!$user || !Hash::check($validated['password'], $user->password)) {
                RateLimiter::hit($key, 60); // Track failed attempt
                
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Clear rate limit on success
            RateLimiter::clear($key);

            // Revoke old tokens (logout from other devices)
            $user->tokens()->delete();

            // Create new secure token
            $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ], 200);
    }

    // Get current user
    public function me(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ]
        ], 200);
    }
}