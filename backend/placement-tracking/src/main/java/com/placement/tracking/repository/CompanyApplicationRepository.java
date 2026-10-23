
package com.placement.tracking.repository;

import com.placement.tracking.entity.CompanyApplication;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyApplicationRepository
        extends JpaRepository<CompanyApplication, Long> {
}
