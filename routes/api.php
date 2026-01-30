<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;

Route::get('/health', function(){
    return response() -> json([
        'status' => 'ok',
        'time' => now() ->toISOString(),
    ]);
});

Route::apiResource('tasks', TaskController::class);
