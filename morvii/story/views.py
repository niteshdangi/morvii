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
from story.models import *
from accounts import models as Accounts
from django.db.models import Q
import datetime
from django.utils import timezone


class GetStory(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        users = [user.user_secondary for user in Accounts.Follow.objects.filter(
            user=request.user, pending=False).all()]
        users.append(request.user)
        time_threshold = timezone.now() - datetime.timedelta(hours=24)
        stories = Story.objects.filter(
            user__in=users, datetime__gt=time_threshold).order_by('-datetime')
        users = []
        finalData = []
        for story in stories:
            if story.user not in users:
                users.append(story.user)
                finalData.append(
                    {"user": story.user.profile.get_profile(request.user)})
        return Response({"story": finalData})


class GetStoryUser(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user=None, *args, **kwargs):

        if user:
            user = User.objects.filter(username=user).all()[:1]
            user = user[0] if len(user) > 0 else None
            if user:
                time_threshold = timezone.now() - datetime.timedelta(hours=24)
                stories = Story.objects.filter(
                    user=user, datetime__gt=time_threshold).all().order_by('-datetime')
                ss = []
                for story in stories:
                    views = None
                    if user == request.user:
                        views_ = StoryView.objects.filter(story=story).all()
                        views = len(views_)
                    ss.append({"media": story.getMedia(),
                               "datetime": story.datetime, "sid": story.pk, "views": views})
                return Response({"story": ss})

        return Response(status=404)


class StoryViews(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, story,  *args, **kwargs):
        try:
            storyobj = Story.objects.get(pk=story, user=request.user)
            views_ = StoryView.objects.filter(story=storyobj).all()
            views = []
            for view in views_:
                views.append({"user": view.user.profile.get_profile(
                    request.user), "datetime": view.datetime})
            return Response({"views": views})
        except:
            return Response(status=403)

    def delete(self, request, story,  *args, **kwargs):
        try:
            storyobj = Story.objects.get(pk=story, user=request.user).delete()

            return Response({"views": views})
        except:
            return Response(status=403)

    def post(self, request, story, *args, **kwargs):
        try:
            storyobj = Story.objects.get(pk=story)
            try:
                StoryView.objects.get(user=request.user, story=storyobj)
            except:
                StoryView.objects.create(user=request.user, story=storyobj)
        except:
            pass
        return Response(status=200)


class CreateStory(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        # users = [user.user_secondary for user in Accounts.Follow.objects.filter(
        #     user=request.user, pending=False).all()]
        # users.append(request.user)
        media = 0
        if 'media' in request.data.keys():
            media = request.data['media']
        for i in range(0, int(media)):
            if 'media'+str(i) in request.data.keys():
                Story.objects.create(
                    user=request.user, media=request.data['media'+str(i)])
        return Response(status=200)
