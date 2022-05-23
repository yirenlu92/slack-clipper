# slack-clipper
Slack app to clip threads into markdown files

1. `git clone git@github.com:yirenlu92/slack-clipper.git`
2. Start backend

```sh
cd slack-clipper-backend
```

## create virtual environment
```sh
python3 -m venv venv 
```

## activate virtual environment
```sh
source venv/bin/activate
```

## install dependencies
```sh
pip3 install -r requirements.txt
```

## set environment variables

Go to https://api.slack.com/apps/A03EH4WGB9C  >> OAuth & Permissions and copy the Bot User OAuth Token, then run the command below:

```sh
export SLACK_BOT_TOKEN=<bot_user_oauth_token>
```

Go to https://api.slack.com/apps/A03EH4WGB9C/general? and copy the Signing secret, then run the command below:

```sh
export SLACK_SIGNING_SECRET=<slack_signing_secret>
```

You can also put these in a .bashrc file so that you don't have to re-export them every time you open up a terminal window.

## start backend

```sh
python3 app.py
```

## proxy the local address to an external facing ip address

Open up a separate window in terminal

In this terminal, run

```sh
./ngrok http 3000
```

You will see something that looks like

```console
Session Status                online                                                                                                           
Session Expires               1 hour, 58 minutes                                                                                               
Update                        update available (version 2.3.40, Ctrl-U to update)                                                              
Version                       2.3.35                                                                                                           
Region                        United States (us)                                                                                               
Web Interface                 http://127.0.0.1:4040                                                                                            
Forwarding                    http://1ff9-205-220-128-103.ngrok.io -> http://localhost:3000                                                    
Forwarding                    https://1ff9-205-220-128-103.ngrok.io -> http://localhost:3000                                                   
                                                                                                                                               
Connections                   ttl     opn     rt1     rt5     p50     p90                                                                      
                              0       0       0.00    0.00    0.00    0.00        
```

Cooy the forwarding address (in this case http://1ff9-205-220-128-103.ngrok.io)

3. Go to https://api.slack.com/apps/A03EH4WGB9C/interactive-messages and replace the first part of the Request URL with the forwarding address you copied above.

4. Go to Slack channel #general in Frindle Slack and see if you can clip something

5. In the terminal (in the same window where the server is running), you should see something like this:

```console
127.0.0.1 - - [23/May/2022 11:12:43] "POST /slack/events HTTP/1.1" 200 -
Uploading to Firebase...
File uploaded successfully: ffdd42bb-c1db-4ee0-8a7e-792a7c17aa3b.md
```

6. Go to Firebase >> Slack Clipper >> Storage, and you should see the markdown file

Download the markdown file and open it up in VScode to see the preview







