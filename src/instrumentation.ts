export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const globalForReport = globalThis as unknown as {
      __docnovaDailyReportSchedulerStarted?: boolean;
    };

    if (!globalForReport.__docnovaDailyReportSchedulerStarted) {
      globalForReport.__docnovaDailyReportSchedulerStarted = true;

      const runCheck = async () => {
        try {
          const { ensureDailyTelegramReportSent } = await import("@/lib/telegram-ai-report");
          await ensureDailyTelegramReportSent();
        } catch (err) {
          console.error("[INSTRUMENTATION_DAILY_REPORT_CHECK_ERR]", err);
        }
      };

      // Initial check 30s after server boot, then every 15 minutes
      setTimeout(() => {
        void runCheck();
      }, 30_000);

      setInterval(
        () => {
          void runCheck();
        },
        15 * 60 * 1000
      );
    }
  }
}
