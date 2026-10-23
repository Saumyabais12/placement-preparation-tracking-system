
package com.placement.tracking.repository;

import com.placement.tracking.entity.PreparationTask;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PreparationTaskRepository
        extends JpaRepository<PreparationTask, Long> {
}
