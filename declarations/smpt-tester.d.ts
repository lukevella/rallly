declare module "smtp-tester" {
  /**
   * Initializes the SMTP tester.
   *
   * @param port The port of the SMTP server.
   */
  function init(port: number): SmtpTester;

  /**
   * A callback that occurs when an email is received.
   *
   * @param recipient The bound recipient. Can be `undefined` if the handler is not bound to a specific recipient.
   * @param id The local incrementing identifier of the email.
   * @param email The email being received.
   */
  type OnReceiveEmail = (
    recipient: string,
    id: number,
    email: EmailInfo,
  ) => void;

  type CaptureOneResponse = {
    address: string;
    id: string;
    email: EmailInfo;
  };
  /**
   * The SMTP tester.
   */
  interface SmtpTester {
    /**
     * Binds a callback to a specific recipient that is fired whenever an email is received for that specific recipient.
     *
     * @param recipient The recipient to bind to.
     * @param callback The callback function.
     */
    bind(recipient: string, callback: OnReceiveEmail): void;

    /**
     * Binds a callback that is fired whenever an email is received.
     *
     * @param callback The callback function.
     */
    bind(callback: OnReceiveEmail): void;

    /**
     * Captures the next email received by the server.
     *
     * @param recipient The recipient to capture for. If not specified, the next email received will be captured.
     * @param options The options for the capture.
     */
    captureOne(
      recipient: string,
      options?: CaptureOptions,
    ): Promise<CaptureOneResponse>;

    /**
     * Stops the running SMTP server.
     */
    stop(): void;

    /**
     * Stops the running SMTP server.
     *
     * @param callback The callback that is fired when the server has stopped.
     */
    stop(callback: () => void): void;
  }

  /**
   * Contains information about a received email.
   */
  interface EmailInfo {
    /**
     * The sender of the email.
     */
    readonly sender: string;

    /**
     * The body of the email.
     */
    readonly body: string;

    /**
     * The HTML body of the email.
     */
    readonly html: string;

    /**
     * Headers of the email.
     */
    readonly headers: {
      /**
       * Who the email was sent from.
       */
      from: string;

      /**
       * Who the email was sent to.
       */
      to: string;

      /**
       * The subject of the email.
       */
      subject: string;

      [string]: string;
    };
  }
}
