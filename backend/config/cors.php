<?php

return [

    /**
     * Paths that should have CORS enabled
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    /**
     * Allowed HTTP methods
     */
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    /**
     * Allow requests from these origins
     * Add your React dev server URLs here
     */
    'allowed_origins' => [
        'http://localhost:5173',      // Vite default port
        'http://localhost:3000',      // React default port
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    /**
     * Allow all headers
     */
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /**
     * Allow cookies/credentials
     */
    'supports_credentials' => true,

];