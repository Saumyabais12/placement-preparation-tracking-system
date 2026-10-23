
package com.placement.tracking.controller;

import com.placement.tracking.entity.CompanyApplication;
import com.placement.tracking.repository.CompanyApplicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:5173")
public class CompanyApplicationController {

    private final CompanyApplicationRepository repository;

    public CompanyApplicationController(
            CompanyApplicationRepository repository) {
        this.repository = repository;
    }

    // Get all company applications
    @GetMapping
    public List<CompanyApplication> getAllApplications() {
        return repository.findAll();
    }

    // Add a company application
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyApplication addApplication(
            @RequestBody CompanyApplication application) {
        application.setId(null);
        return repository.save(application);
    }

    // Update an existing application
    @PutMapping("/{id}")
    public CompanyApplication updateApplication(
            @PathVariable Long id,
            @RequestBody CompanyApplication updatedApplication) {

        CompanyApplication application = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company application not found"));

        application.setCompanyName(updatedApplication.getCompanyName());
        application.setJobRole(updatedApplication.getJobRole());
        application.setApplicationDate(updatedApplication.getApplicationDate());
        application.setStatus(updatedApplication.getStatus());
        application.setJobLink(updatedApplication.getJobLink());
        application.setNotes(updatedApplication.getNotes());

        return repository.save(application);
    }

    // Delete an application
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApplication(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Company application not found");
        }

        repository.deleteById(id);
    }
}
