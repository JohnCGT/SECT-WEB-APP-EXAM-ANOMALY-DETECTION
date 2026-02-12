<?php

return [

    /**
     * Paths that should have CORS enabled
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    /**
     * Allowed HTTP methods
     */
    'allowed_methods' => ['*'],

    /**
     * Allow requests from these origins
     * Add your React dev server URLs here
     */
    'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],

    'allowed_origins_patterns' => [],

    /**
     * Allow all headers
     */
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    /**
     * Allow cookies/credentials
     */
    'supports_credentials' => true,

];