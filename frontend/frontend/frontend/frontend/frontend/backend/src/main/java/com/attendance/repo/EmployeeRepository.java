package com.attendance.repo;

import com.attendance.domain.Employee;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
  @Override
  @EntityGraph(attributePaths = {"companyRole", "assignedOfficeLocation", "department", "shift", "user"})
  java.util.List<Employee> findAll();

  @Override
  @EntityGraph(attributePaths = {"companyRole", "assignedOfficeLocation", "department", "shift", "user"})
  Optional<Employee> findById(Long id);

  @EntityGraph(attributePaths = {"companyRole", "assignedOfficeLocation", "department", "shift", "user"})
  Optional<Employee> findByUser_Id(Long userId);
  boolean existsByEmployeeNumber(String employeeNumber);
}
