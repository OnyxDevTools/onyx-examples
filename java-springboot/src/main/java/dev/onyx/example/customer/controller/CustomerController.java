package dev.onyx.example.customer.controller;

import dev.onyx.example.customer.dto.CustomerRequest;
import dev.onyx.example.customer.model.Customer;
import dev.onyx.example.customer.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<Customer> create(@Valid @RequestBody CustomerRequest request) {
        Customer created = customerService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<Customer> getById(@PathVariable String customerId,
                                            @RequestParam(name = "countryCode", required = false) String countryCode) {
        Optional<Customer> customer = customerService.get(customerId, countryCode);
        return customer.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Customer>> list(@RequestParam(name = "countryCode", required = false) String countryCode,
                                               @RequestParam(name = "pageSize", required = false) Integer pageSize) {
        List<Customer> customers = customerService.list(countryCode, pageSize);
        return ResponseEntity.ok(customers);
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<Customer> update(@PathVariable String customerId,
                                           @Valid @RequestBody CustomerRequest request,
                                           @RequestParam(name = "countryCode", required = false) String countryCode) {
        Customer updated = customerService.update(customerId, request, countryCode);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> delete(@PathVariable String customerId,
                                       @RequestParam(name = "countryCode", required = false) String countryCode) {
        boolean deleted = customerService.delete(customerId, countryCode);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
