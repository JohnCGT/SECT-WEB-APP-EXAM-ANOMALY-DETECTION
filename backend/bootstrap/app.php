<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware) {
        // HandleCors must be FIRST so it runs on every request including
        // /sanctum/csrf-cookie before anything else can block the response
        $middleware->prepend(HandleCors::class);

        // Stateful API enables Sanctum session-based auth for SPA
        $middleware->statefulApi();

        $middleware->trustProxies(at: '*');

        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
    })

    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();