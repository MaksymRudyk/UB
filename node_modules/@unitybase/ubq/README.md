The asynchronous task queue persisted into database.
This module contains jobs for sending e-mail and updating FTS indexes.

## Partial and environment variables

Model partial config adds `application.customSettings.mailerConfig` section.

Used environment variables:
 
| Variable name | Default | Description |
|---------------|---------|-------------|
| UB_SMTP_HOST  |         | SMTP host   |
| UB_SMTP_PORT  | 25      | SMTP port   |
| UB_SMTP_FROMADDR| no-reply@fake.com| Default from address |
| UB_SMTP_USER  |         | if authentication required - SMTP user name |
| UB_SMTP_PWD   |         | if authentication required - SMTP user password | 
| UB_SMTP_TLS   | false   | is TLS required for SMTP connection |
| UB_SMTP_AUTH  | false   | use authentication to the SMTP server |
| UB_SMTP_FULL_SSL | false | establish TLS connection before any SMTP command | 
