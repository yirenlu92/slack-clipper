import os
from slack_bolt import App

app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET")
)

def get_conversation_thread(client, channel, ts):
    replies = client.conversations_replies(channel=channel, ts=ts)
    messages = list()
    users = {}
    for message in replies["messages"]:
        user_id = message["user"]
        if user_id not in users:
            user_info = client.users_info(user=user_id)
            users[user_id] = {
                "name": user_info["user"]["name"],
                "profile_picture": user_info["user"]["profile"]["image_24"]
                }
        
        messages.append({
            "text": message["text"],
            "name": users[user_id]["name"],
            "profile_picture": users[user_id]["profile_picture"]
            })
        
    return messages

def make_markdown_message(name, profile_picture, text):
    return f"""
<div style="-webkit-column-count: 2; -moz-column-count: 2; column-count: 2;">
    <div style="display: inline-block;">
        <img src="{profile_picture}" alt="{name}">
    </div>
    <div style="display: inline-block;">
        <strong>{name}</strong>
    </div>
</div>

{text}
        
        """

def get_markdown_text(conversation_thread):
    markdown_text = ""

    if len(conversation_thread) > 0:
        message = conversation_thread[0]
        markdown_text += make_markdown_message(
            message["name"],
            message["profile_picture"],
            message["text"]
            )
    
    markdown_text += """
---
    """

    for message in conversation_thread[1:]:
        markdown_text += make_markdown_message(
            message["name"],
            message["profile_picture"],
            message["text"]
            )
    
    return markdown_text


@app.shortcut("clip_markdown")
def clip_markdown(ack, shortcut, client):
    ack()

    channel = shortcut["channel"]["id"]
    ts = shortcut["message"]["ts"]
    title = shortcut["message"]["text"]

    print(f"[CLIP] channel={channel} ts={ts} thread-title='{title}'")
    
    conversation_thread = get_conversation_thread(client, channel, ts)
    # print("conversation_thread", conversation_thread)
    markdown_text = get_markdown_text(conversation_thread)
    print(markdown_text)
    with open("test.md", "w") as f:
        f.write(markdown_text)


# Start your app
if __name__ == "__main__":
    app.start(port=int(os.environ.get("PORT", 5000)))
