from django.shortcuts import render
from rest_framework.authtoken.views import ObtainAuthToken, APIView
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
import re
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
import json
from rest_framework.authentication import BasicAuthentication, TokenAuthentication
from django.core.serializers import serialize
from messenger.models import *
from django.db.models import Count
from accounts import models as Accounts
from django.db.models import Q
import datetime
from django.utils import timezone
from story.models import Story
import requests
from mopic.models import Mopic
import firebase_admin
from firebase_admin import credentials
from firebase_admin import messaging

cred = credentials.Certificate(
    "morvii-firebase-adminsdk-1lr8f-03ff919256.json")
firebase_admin.initialize_app(cred)


class MessagesHome(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        users = Messages.objects.filter(
            Q(user_1=request.user) | Q(user_2=request.user)).all()
        unreadMessages = Messenger.objects.filter(
            receiver=request.user, sent=False).all()
        for msg in unreadMessages:
            msg.sent = True
            msg.save()

        messages = [{"inboxType": msg.getInboxType(request.user), "message": msg.message.get_message(request.user), "user": msg.message.sender.profile.get_profile(
            request.user) if msg.message.sender != request.user else msg.message.receiver.profile.get_profile(request.user)} for msg in users]

        return Response({"users": messages})


class MessageHistory(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user=None, *args, **kwargs):
        if user:
            user = User.objects.filter(
                username=user).all()
            user = user[0] if len(user) > 0 else None
            if user:
                if 'previous' in request.data.keys():
                    history = Messenger.objects.filter(
                        Q(sender=request.user, receiver=user) | Q(sender=user, receiver=request.user), datetime__lt=request.data['previous']).all().order_by('-datetime')[:15]
                else:
                    history = Messenger.objects.filter(
                        Q(sender=request.user, receiver=user) | Q(sender=user, receiver=request.user)).all().order_by('-datetime')[:15]

                messages = [msg.get_message(request.user) for msg in history]

                return Response({"history": messages})
        return Response(status=404)


class ReceiveMessage(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if 'sender' in request.data.keys():
            sender = User.objects.filter(
                username=request.data['sender']).all()
            sender = sender[0] if len(sender) > 0 else None
            if sender:
                messages = Messenger.objects.filter(
                    sender=sender, receiver=request.user).all()
                for msg in messages:
                    msg.sent = True
                    msg.save()
                requests.post("http://localhost:8080/", json={"user": [sender.username],
                                                              "data": {"type": "sent_message", "message": {"receiver": sender.username}}})
        return Response(status=200)


class SendMessage(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if 'sender' in request.data.keys():
            sender = User.objects.filter(
                username=request.data['sender']).all()
            sender = sender[0] if len(sender) > 0 else None
            if sender:
                messages = Messenger.objects.filter(
                    sender=sender, receiver=request.user, seen=False).all()
                for msg in messages:
                    msg.seen = True
                    msg.sent = True
                    msg.save()
                requests.post("http://localhost:8080/", json={"user": [sender.username],
                                                              "data": {"type": "seen_message", "message": {"receiver": sender.username}}})
        return Response(status=200)

    def delete(self, request, *args, **kwargs):
        if 'mid' in request.data.keys():
            try:
                message = Messenger.objects.get(pk=request.data['mid'])
                message.delete()
            except:
                pass
        return Response(status=200)

    def put(self, request, *args, **kwargs):
        if 'receiver' in request.data.keys():
            receiver = User.objects.filter(
                username=request.data['receiver']).all()
            receiver = receiver[0] if len(receiver) > 0 else None
            if receiver:
                reply = None
                story = None
                media = None
                message = None
                post = None
                sticker = None
                gif = None
                message_ = [[str(m.datetime.timestamp()), m.message] for m in Messenger.objects.filter(
                    seen=False, receiver=receiver)[:5]]
                if 'reply_mid' in request.data.keys():
                    replyObj = Messenger.objects.filter(
                        pk=request.data['reply_mid']).all()[:1]
                    reply = replyObj[0] if len(replyObj) > 0 else None

                if 'post' in request.data.keys():
                    mopicObj = Mopic.objects.filter(
                        pk=request.data['post']).all()[:1]
                    post = mopicObj[0] if len(mopicObj) > 0 else None
                if 'storyReply' in request.data.keys():
                    storyObj = Story.objects.filter(user=receiver).all()
                    story = storyObj[request.data['storyReply']] if len(
                        storyObj) > request.data['storyReply'] else None
                if 'media' in request.data.keys():
                    media = request.data['media']
                if 'sticker' in request.data.keys():
                    sticker = request.data['sticker']
                if 'gif' in request.data.keys():
                    gif = request.data['gif']
                if 'message' in request.data.keys():
                    message = request.data['message']
                    message_.append([str(timezone.now().timestamp()), message])
                if message or media or story or post or sticker or gif:
                    message = Messenger.objects.create(
                        sender=request.user, receiver=receiver, mopic=post, sticker=sticker, gif=gif, media=media, story=story, messageReply=reply, message=message)
                else:
                    return Response(status=403)
                if receiver.profile.fcm:
                    try:
                        rec_prof = request.user.profile.get_profile(receiver)
                        message_notification = messaging.Message(

                            data={"type": "message",
                                  "user": rec_prof['username'], "icon": rec_prof['profile']['image'], "message": str(message_).replace("'", '"'),
                                  },
                            token=receiver.profile.fcm,
                        )
                        messaging.send(message_notification)
                    except:
                        pass
                requests.post("http://localhost:8080/", json={"user": [receiver.username],
                                                              "data": {"type": "new_message", "sender": request.user.profile.get_profile(request.user), "message": message.get_message(request.user)}})
                return Response({"id": message.pk}, status=200)

        return Response(status=403)


class Search(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def get(self, request, query=None, *args, **kwargs):
        users = []
        results = []
        if query:
            users = User.objects.filter(
                Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)).all()
        for user in users:
            if user != request.user:
                message = Messenger.objects.filter(Q(sender=request.user) | Q(
                    receiver=request.user)).all().order_by('-datetime')[:1]
                lastMessage = message[0].get_message(request.user) if len(
                    message) > 0 else None
                results.append({"user": user.profile.get_profile(
                    request.user), "message": lastMessage})
        return Response({"users": results})


class Theme(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def put(self, request, *args, **kwargs):
        try:
            MessengerTheme.objects.create(user=request.user, public=request.data['public'], name=request.data['name'], bg=request.data['bg'],
                                          bgDark=request.data['bgDark'], bgLight=request.data['bgLight'], color=request.data['color'],
                                          hint=request.data['hint'], gradient=request.data[
                                              'gradient'], secondary=request.data['secondary'],
                                          primary=request.data['primary'], secondaryAccent=request.data['secondaryAccent'],
                                          primaryAccent=request.data[
                                              'primaryAccent'], secondaryAccentHint=request.data['secondaryAccentHint'],
                                          primaryAccentHint=request.data['primaryAccentHint'], preview=request.data['preview'],
                                          background=request.data['background'], header=request.data['header'], footer=request.data['footer'])
            return Response(status=200)

        except:
            return Response(status=406)

    def get(self, request, *args, **kwargs):
        if 'q' in request.GET.keys():
            if request.GET['q'].strip():
                themes = [x.generateTheme()
                          for x in MessengerTheme.objects.filter(name__icontains=request.GET['q']).order_by('-datetime').all()[:8]]
                return Response({"themes": themes})
            return Response({"themes": []})
        themes = [x.generateTheme()
                  for x in MessengerTheme.objects.filter(Q(user=None)).order_by('-datetime').all()[:5]]
        time_threshold = timezone.now() - datetime.timedelta(hours=6)
        trends = ThemeData.objects.filter(
            datetime__gt=time_threshold).all().order_by("-datetime")
        themeTrends = {}
        for trend in trends:
            if trend.theme:
                if trend.theme.pk not in themeTrends.keys():
                    themeTrends[trend.theme.pk] = 1
                else:
                    themeTrends[trend.theme.pk] = themeTrends[trend.theme.pk] + 1
        trends = sorted(
            themeTrends.items(), key=lambda x: x[1], reverse=True)[:3]
        for trend in trends:
            try:
                themes.append(MessengerTheme.objects.get(
                    pk=trend[0]).generateTheme())
            except:
                pass
        themes_user = [x.generateTheme() for x in MessengerTheme.objects.filter(
            user=request.user).all().order_by('-datetime')[:3]]

        return Response({"themes": [*themes, *themes_user], "trends": trends})

    def post(self, request, *args, **kwargs):
        try:
            theme = None
            if request.data['id'] != "default":
                theme = MessengerTheme.objects.get(pk=request.data['id'])
            user = User.objects.get(username=request.data['user'])
            ThemeData.objects.update_or_create(
                user=request.user, user_secondary=user, defaults={"theme": theme})
        except:
            pass
        return Response(status=200)


class Call(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def post(self, request, user=None, *args, **kwargs):
        if user:
            try:
                user = User.objects.get(username=user)

                if user.activity.connected:
                    requests.post("http://localhost:8080/", json={"user": [user.username],
                                                                  "data": {"type": request.data['response'], "user": request.user.username, "name": request.user.first_name+" " +
                                                                           request.user.last_name, "image": request.user.profile.image.url if request.user.profile.image else None}})
                    return Response(status=200)
                if user.profile.fcm:
                    try:
                        message_notification = messaging.Message(

                            data={"type": request.data['response'], "user": request.user.username, "name": request.user.first_name+" " +
                                  request.user.last_name, "image": request.user.profile.image.url if request.user.profile.image else "None"},
                            token=user.profile.fcm,
                        )
                        messaging.send(message_notification)
                        return Response(status=200)
                    except:
                        pass
            except Exception as e:
                # print(e)
                pass

        return Response(status=404)

    def get(self, request, user=None, *args, **kwargs):
        if user:
            try:
                user = User.objects.get(username=user)
                if user.profile.fcm:
                    try:
                        message_notification = messaging.Message(

                            data={"type": "receive_call", "user": request.user.username, "name": request.user.first_name+" " +
                                  request.user.last_name, "image": request.user.profile.image.url if request.user.profile.image else "None"},
                            token=user.profile.fcm,
                        )
                        messaging.send(message_notification)
                        return Response(status=200)
                    except:
                        pass
                if user.activity.connected:
                    requests.post("http://localhost:8080/", json={"user": [user.username],
                                                                  "data": {"type": "receive_call", "user": request.user.username, "name": request.user.first_name+" " +
                                                                           request.user.last_name, "image": request.user.profile.image.url if request.user.profile.image else None}})
                    return Response(status=200)
            except Exception as e:
                print(e)

        return Response(status=404)
