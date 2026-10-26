package com.placement.tracking.controller;

import com.placement.tracking.entity.PreparationTask;
import com.placement.tracking.repository.PreparationTaskRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class PreparationTaskController {

    private final PreparationTaskRepository repository;

    public PreparationTaskController(
            PreparationTaskRepository repository) {
        this.repository = repository;
    }

    // Get all preparation tasks
    @GetMapping
    public List<PreparationTask> getAllTasks() {
        return repository.findAll();
    }

    // Add a new preparation task
    @PostMapping
    public PreparationTask addTask(
            @RequestBody PreparationTask task) {
        return repository.save(task);
    }

    // Update a preparation task
    @PutMapping("/{id}")
    public PreparationTask updateTask(
            @PathVariable Long id,
            @RequestBody PreparationTask updatedTask) {

        PreparationTask task = repository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException("Task not found: " + id));

        task.setTitle(updatedTask.getTitle());
        task.setCategory(updatedTask.getCategory());
        task.setCompleted(updatedTask.isCompleted());

        return repository.save(task);
    }

    // Delete a preparation task
    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        repository.deleteById(id);
    }
}