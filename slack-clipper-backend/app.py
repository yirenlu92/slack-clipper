import os
from slack_bolt import App

app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET")
)

def get_conversation_thread(client, channel, ts):
    replies = client.conversations_replies(channel=channel, ts=ts)
    messages = list()
    for message in replies["messages"]:
        messages.append({
            "text": message["text"],
            "user": message["user"]
            })
    return messages

@app.shortcut("clip_markdown")
def clip_markdown(ack, shortcut, client):
    ack()

    channel = shortcut["channel"]["id"]
    ts = shortcut["message"]["ts"]
    title = shortcut["message"]["text"]

    print(f"[CLIP] channel={channel} ts={ts} thread-title='{title}'")
    
    conversation_thread = get_conversation_thread(client, channel, ts)
    print("conversation_thread", conversation_thread)


# Start your app
if __name__ == "__main__":
    app.start(port=int(os.environ.get("PORT", 5000)))
