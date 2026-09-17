package com.lucas.ecomm.shared.api;

import java.time.Instant;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/public", produces = MediaType.APPLICATION_JSON_VALUE)
public class ApiStatusController {

    @GetMapping("/status")
    public ApplicationStatusResponse status() {
        return new ApplicationStatusResponse("ecommerce-backend", "UP", Instant.now());
    }

    public record ApplicationStatusResponse(String application, String status, Instant timestamp) {
    }
}
