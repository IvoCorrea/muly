package com.muly.common.exception;

public class ReservedUsernameException extends RuntimeException {
    public ReservedUsernameException(String message) {
        super(message);
    }
}
