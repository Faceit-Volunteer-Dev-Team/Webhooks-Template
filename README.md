# Webhooks-Template
A collection of templates for integrating with FACEIT's API services.
# Features
Express.js webhook handler
Security middleware
Match data processing
Discord integration
Detailed logging

 
# Setup

1.Clone the repository
``` git clone  https://github.com/Faceit-Volunteer-Dev-Team/Webhooks-Template```

2.Install dependencies:

``` npm install```


3.Create a `.env` file with the following variables:
```
FACEIT_API_KEY=your_api_key
SECURITY_HEADER_NAME=your_security_header
SECURITY_HEADER_VALUE=your_security_value
SECURITY_QUERY_NAME=your_query_param
SECURITY_QUERY_VALUE=your_query_value
DISCORD_WEBHOOK_URL=your_discord_webhook_url
PORT=3000
```


```
// Start the webhook server
npm run start
```
#SS

![Match Ready](match_ready)
![Match Finished](match_finished)

# Contribution
Contributions are welcome! Please feel free to submit a Pull Request.

# Support
If you have any questions or run into issues, please open an issue in the repository.
