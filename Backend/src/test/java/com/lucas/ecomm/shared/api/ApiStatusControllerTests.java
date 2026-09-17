package com.lucas.ecomm.shared.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ApiStatusControllerTests {

    @Test
    void shouldReportApplicationAsUp() {
        var response = new ApiStatusController().status();

        assertThat(response.application()).isEqualTo("ecommerce-backend");
        assertThat(response.status()).isEqualTo("UP");
        assertThat(response.timestamp()).isNotNull();
    }
}
