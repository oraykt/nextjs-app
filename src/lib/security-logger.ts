type LogLevel = "info" | "warn" | "error";

interface SecurityLogData {
  userId: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  status: "success" | "failure";
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
}

export class SecurityLogger {
  private static formatLog(level: LogLevel, data: SecurityLogData): string {
    const timestamp = new Date().toISOString();
    const userInfo = data.userId ? `User: ${data.userId}` : "User: Anonymous";
    const resourceInfo = data.resource
      ? `${data.resource}${data.resourceId ? `/${data.resourceId}` : ""}`
      : "N/A";

    return [
      `[${timestamp}] [${level.toUpperCase()}] [SECURITY]`,
      userInfo,
      `Action: ${data.action}`,
      `Resource: ${resourceInfo}`,
      `Status: ${data.status}`,
      data.ipAddress ? `IP: ${data.ipAddress}` : "",
      data.error ? `Error: ${data.error}` : "",
      data.details ? `Details: ${JSON.stringify(data.details)}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  static log(data: SecurityLogData): void {
    const level: LogLevel = data.status === "failure" ? "error" : "info";
    const logMessage = this.formatLog(level, data);

    if (level === "error") {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }

    // TODO: Send to external logging service (e.g., Datadog, Sentry, CloudWatch)
    // await this.sendToExternalLogger(data);
  }

  static logSuccess(data: Omit<SecurityLogData, "status">): void {
    this.log({ ...data, status: "success" });
  }

  static logFailure(data: Omit<SecurityLogData, "status">): void {
    this.log({ ...data, status: "failure" });
  }

  static logProcedure(
    userId: string | null,
    procedureName: string,
    input: Record<string, unknown>,
    result: "success" | "failure",
    error?: Error,
  ): void {
    this.log({
      userId,
      action: procedureName,
      status: result,
      details: { input },
      error: error?.message,
    });
  }
}
