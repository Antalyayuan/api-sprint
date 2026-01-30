<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Task;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //Get/api/tasks
        return Task::query()
            ->orderByDesc('id')
            ->paginate(10);
    }

    /**
     * Store a newly created resource in storage.
     */
    //Post/api/tasks
    public function store(Request $request)
    {
        //
        $data = $request->validate([
            'title'=> ['required', 'string','max:255'],
        ]);
        $task = Task::create($data);
        return response()->json($task, 201);
    }

    /**
     * Display the specified resource.
     */
    //Get/api/tasks{task}
    public function show(Task $task)
    {
        //
        return $task;
    }

    /**
     * Update the specified resource in storage.
     */
    //patch/api/tasks/{task}
    public function update(Request $request, Task $task)
    {
        //
        $data = $request->validate([
            'title'=> ['sometimes', 'string','max:255'],
            'done'=> ['sometimes', 'boolean'],
        ]);
        $task->update($data);
        return $task;
    }

    /**
     * Remove the specified resource from storage.
     */
    //delete/api/taks/{task}
    public function destroy(Task $task)
    {
        //
        $task->delete();
        return response()->json(null, 204);
    }
}
