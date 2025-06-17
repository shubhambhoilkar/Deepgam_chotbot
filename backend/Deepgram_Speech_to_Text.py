#Deepgram Speech To Text with chat history, github link: https://github.com/shubhambhoilkar/Deepgram-Chatbot/blob/main/deepgram_working_stt.py
#working great, can be use for Demo 
import os
import asyncio
import openai
import uvicorn
#import React, {useState, useEffect, useRef} from 'react';
from fastapi import FastAPI, WebSocket
from dotenv import load_dotenv
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    LiveTranscriptionEvents,
    LiveOptions,
    Microphone,
)

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

chat_history =[]
#added system prompt:
system_prompt = {
    "role": "system",
    "content": "You are a helpful AI assistant specialized in speech-to-text applications. Always provide accurate, concise, and friendly responses."
}

#Fast api code 
app = FastAPI()
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()
            print(f"Received from client: {data}")
            ai_response = await get_ai_response(data)
            await websocket.send_text(ai_response)  # Dummy response
        except Exception as e:
            print(f"WebSocket connection closed: {e}")
            break


'''@app.post("/chat")
async def chat_endpoint(message: dict):
    user_message = message.get("message")
    response =await get_ai_response(message)
    return {"response": response}
'''#Frontend respose


#Core working Chatbot code from Customer response to the Ai response
class TranscriptCollector:
    def __init__(self):
        self.reset()

    def reset(self):
        self.transcript_parts = []

    def add_part(self, part):
        self.transcript_parts.append(part)

    def get_full_transcript(self):
        return ' '.join(self.transcript_parts)

transcript_collector = TranscriptCollector()

silence_counter = 0
silence_timeout = 18 #seconds 

async def get_transcript(websocket):
    global silence_counter
    try:
        api_key = os.getenv("DEEPGRAM_API_KEY")
        if not api_key:
            print("Missing Deepgram API Key")
            return

        config = DeepgramClientOptions(options={"keepalive": "true"})
        deepgram: DeepgramClient = DeepgramClient(api_key, config)
        dg_connection = deepgram.listen.asyncwebsocket.v("1")

        #start silence monitor
        last_activity = asyncio.get_event_loop().time()
        stop_listening = False

        async def silence_monitor():
            nonlocal last_activity, stop_listening
            global silence_counter
            while not stop_listening:
                await asyncio.sleep(1)
                if asyncio.get_event_loop().time() - last_activity > silence_timeout:
                    silence_counter += 1
                    if silence_counter ==1:
                        print("AI: Are you speaking? I haven't hear from you in a while.")
                    elif silence_counter == 2:
                        print("AI: Ending session due to inactivity.")
                        stop_listening = True
                        microphone.finish()
                        await dg_connection.finish()
                        break
                    last_activity = asyncio.get_event_loop().time()

        finalization_task = None
        async def on_message(self, result, **kwargs):
            nonlocal last_activity, stop_listening, finalization_task
            global silence_counter

            if stop_listening:
                return
            
            sentence = result.channel.alternatives[0].transcript

            if result.speech_final:
                transcript_collector.add_part(sentence)
                full_sentence = transcript_collector.get_full_transcript().strip()

                silence_counter = 0
                last_activity = asyncio.get_event_loop().time()

                if finalization_task:
                    finalization_task.cancel()
                
                finalization_task = asyncio.create_task(process_after_delay(full_sentence))

        async def process_after_delay(full_sentence):
            try:
                await asyncio.sleep(1.0)
                if len(full_sentence) < 1:
                    return
                print(f"speaker: {full_sentence}")

                ai_response = await get_ai_response(full_sentence)
                print(f"AI: {ai_response}")
                await websocket.send_text(ai_response)
                transcript_collector.reset()
            
            except asyncio.CancelledError:
                pass

        async def on_error(self, error, **kwargs):
            print(f"\n\n{error}\n\n")

        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.Error, on_error)

        options = LiveOptions(
            model="nova-2",
            punctuate=True,
            language="en-US",
            encoding="linear16",
            channels=1,
            sample_rate=16000,
            endpointing=True
        )

        await dg_connection.start(options)

        # You can specify device_index if needed
        microphone = Microphone(dg_connection.send)
        microphone.start()
        asyncio.create_task(silence_monitor())

        while True:
            if not microphone.is_active():
                break
            await asyncio.sleep(1)

        microphone.finish()
        await dg_connection.finish()

        print("Finished")

    except Exception as e:
        print(f"Could not open socket: {e}")
        return

async def get_ai_response(prompt):
    try:
        global chat_history
        chat_history.append({"role":"user","content":prompt})
        messages = [system_prompt] + chat_history

        response = await openai.ChatCompletion.acreate(
            model ="gpt-3.5-turbo-1106",
            messages=messages
        )

        ai_text =response["choices"][0]["message"]["content"]

        chat_history.append({"role":"assistant","content":ai_text})
        return ai_text
    except Exception as e:
        print(f"Error from OpenAi: {e}")
        return "Opps, sorry i couldn't process text."


if __name__ == "__main__":
    #asyncio.run(get_transcript())
    uvicorn.run("Deepgram_Speech_to_Text:app", host = "0.0.0.0", port = 9900, reload = True)