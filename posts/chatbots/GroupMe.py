import requests
import time
import json

#*******************************************************************************
################################################################################
# 
# Created by Jacob Strieb for the Chatbots optional lecture given as part of
# the 15-112 Fall 2018 semester at Carnegie Mellon University
# 
################################################################################
#*******************************************************************************

##################################################
# Global Variables
##################################################

# All of these can be found on the bot registration page here:
# https://dev.groupme.com/bots/
accessToken = "<your API key here>"
botId = "<your bot ID here>"
groupId = "<your bot's group ID here>"

##################################################
# GroupMe API Helper Functions
##################################################

# Send a message as the bot
def send(text):
    data = { "bot_id" : botId, "text" : text }
    requests.post("https://api.groupme.com/v3/bots/post", data=data)

# Get my user ID for later API calls
def getUserId(accessToken):
    data = { "access_token" : accessToken }
    r = requests.get("https://api.groupme.com/v3/users/me", params=data)
    return r.json()["response"]["user_id"]

# Get a client ID to use for this session
def getClientId():
    # Copied data from tutorial here: https://dev.groupme.com/tutorials/push
    data = [ {
               "channel" : "/meta/handshake",
               "version" : "1.0",
               "supportedConnectionTypes" : ["long-polling"],
               "id" : "1"
             } ]
    r = requests.post("https://push.groupme.com/faye", json=data)
    return r.json()[0]["clientId"]

# Subscribe to the group channel -- bind the client ID to the user ID
def subscribe(accessToken, clientId):
    # Copied data from tutorial here: https://dev.groupme.com/tutorials/push
    data = [ {
               "channel" : "/meta/subscribe",
               "clientId" : clientId,
               "subscription" : "/user/%s" % getUserId(accessToken),
               "id" : "2",
               "ext" : {
                         "access_token" : accessToken,
                         "timestamp" : int(time.time())
                       }
             } ]
    r = requests.post("https://push.groupme.com/faye", json=data)
    if not r.json()[0]["successful"]: raise Exception("Subscription failed")

# Get new messages from the server
def getNew(clientId, numCalls):
    # Copied data from tutorial here: https://dev.groupme.com/tutorials/push
    data = [ {
               "channel" : "/meta/connect",
               "clientId" : clientId,
               "connectionType" : "in-process",
               "id" : "%d" % numCalls
             } ]
    try:
        r = requests.post("https://push.groupme.com/faye", json=data, stream=True)
    except:
        print("There was a problem getting the next messages.")
        return
    for line in r.iter_lines():
        preProcess(line.decode("utf-8"))

# Ensure each message sent to the right group and not from the bot
def preProcess(line):
    data = json.loads(line)
    for response in data:
        # Make sure it is a message type
        if "data" not in response: continue
        if "type" not in response["data"]: continue
        if response["data"]["type"] != "line.create": continue
        if "subject" not in response["data"]: continue

        # Make sure it was sent to the correct group and not from the bot
        msg = response["data"]["subject"]
        if msg["group_id"] != groupId: continue
        if msg["sender_type"] == "bot": continue

        # If none of the above skipped, actually process the message
        process(msg)

##################################################
# Bot functionality
##################################################

# Process the msg dictionary containing sender and message information
def process(msg):
    send(msg["text"])

    # Uncomment the following line to print the whole message dict
    # print(json.dumps(msg, indent=2))

##################################################
# Main Function
##################################################

if __name__ == "__main__":
    # Try subscribing
    clientId = ""
    try:
        clientId = getClientId()
        subscribe(accessToken, clientId)
    except:
        print("There was a problem while trying to subscribe to the message"
              "feed.")
        exit()

    # Poll the server for new messages
    numCalls = 3
    while True:
        getNew(clientId, numCalls)
        numCalls += 1
