from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
import random
import os
import requests
from uuid import uuid4
from django.db.models import Q
from accounts.utils import file_cleanup
import json
from mopic.models import *
from django.utils.deconstruct import deconstructible
import itertools
from django.utils import timezone
import datetime
from story.models import Story


@deconstructible
class PathAndRename(object):

    def __init__(self, sub_path):
        self.path = sub_path

    def __call__(self, instance, filename):
        ext = filename.split('.')[-1]
        # set filename as random string
        filename = '{}.{}'.format(uuid4().hex, ext)
        # return the whole path to the file
        return os.path.join(self.path, filename)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    mobile = models.TextField(max_length=15, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    private = models.BooleanField(default=False, null=True, blank=True)
    privateComments = models.BooleanField(default=True, null=True, blank=True)
    lastSeen = models.BooleanField(default=True, null=True, blank=True)
    ratingView = models.BooleanField(default=True, null=True, blank=True)
    rating = models.FloatField(default=0)
    gender = models.BooleanField(default=False, blank=True, null=True)
    giphy = models.TextField(blank=True, null=True)
    fcm = models.TextField(blank=True, null=True)

    image = models.ImageField(
        upload_to=PathAndRename(''), blank=True, null=True)
    imageSecondary = models.ImageField(
        upload_to=PathAndRename(''), blank=True, null=True)

    def getImage(self, image):
        return image.url if image else "default/userfemale.png" if self.gender else "default/user.png"

    def getgiphy(self):
        rid = requests.get(
            "https://api.giphy.com/v1/randomid?api_key=BLp12AJExkJK21EMAJeLxSF6IS3YgTwP")
        try:
            rid = rid.json()['data']['random_id']
            self.giphy = rid
            self.save()
        except:
            rid = None
        return rid

    def get_profile(self, instance=None, complete=False):
        image = {}
        following = None
        followback = None
        accept = None
        requested = None

        if instance != self.user:
            following = len(Follow.objects.filter(
                user=instance, user_secondary=self.user, pending=False).all()) > 0
            if not following:
                followback = len(Follow.objects.filter(
                    user_secondary=instance, user=self.user, pending=False).all()) > 0
            accept = len(Follow.objects.filter(
                user_secondary=instance, user=self.user, pending=True).all()) > 0

            requested = len(Follow.objects.filter(
                user=self.user, user_secondary=instance, pending=True).all()) > 0

        if instance.username == self.user.username:
            image = {'image': self.getImage(
                self.image), 'image_secondary': self.getImage(self.imageSecondary), 'server_token': instance.activity.token, "giphy": self.giphy if self.giphy else self.getgiphy()}
        elif self.private:
            following = len(Follow.objects.filter(
                user=instance, user_secondary=self.user).all()) != 0
            image = {'image': self.getImage(
                self.image if following else self.imageSecondary)}
        else:
            image = {'image': self.getImage(self.image)}
        followings = 0
        friends = 0
        fans = 0
        mopics = []
        story = None
        isFriend = False
        isFriend = instance == self.user
        if not self.private:
            isFriend = True
        if complete:
            mopics_ = Mopic.objects.filter(
                user=self.user).all().order_by('-datetime')
            follower = Follow.objects.filter(user_secondary=self.user).all()
            fuser = [f.user for f in follower]

            if instance in fuser:
                isFriend = True
            following_ = Follow.objects.filter(user=self.user).all()
            followings = len(following_)
            for (f, k) in zip(follower, following_):
                if f.user_secondary == k.user:
                    friends += 1
                else:
                    fans += 1
            diff = len(follower) - len(following_)
            diff = diff if diff > 0 else 0
            fans += diff
            if isFriend or instance == self.user:
                time_threshold = timezone.now() - datetime.timedelta(hours=24)
                story = Story.objects.filter(
                    user=self.user, datetime__gt=time_threshold).all().order_by('-datetime')
                story = [st.getMedia() for st in story]
                if len(story) > 0:
                    story = story[random.randint(0, len(story)-1)]
                else:
                    story = None
                for obj in mopics_:
                    ratings = MopicRate.objects.filter(mopic=obj).all()
                    selfRate = MopicRate.objects.filter(
                        mopic=obj, user=instance).all()
                    selfRate = True if len(selfRate) > 0 else False
                    pc = len(MopicComment.objects.filter(
                        mopic=obj, private=True).all())

                    rates = 0
                    for i in ratings:
                        rates += i.rating
                    mopics.append({"id": obj.pk, "date": obj.datetime,
                                   "liked": len(MopicLike.objects.filter(mopic=obj, user=instance).all()) != 0,
                                   "likes": len(MopicLike.objects.filter(mopic=obj).all()),
                                   "comments": len(MopicComment.objects.filter(mopic=obj).all())+len(MopicCommentReply.objects.filter(commentMain__mopic=obj).all()),
                                   "rating": selfRate, "location": obj.location, "caption": obj.caption,
                                   "privateCount": pc, "ratingCount": len(ratings), "rate": rates/len(ratings) if len(ratings) > 0 else 0,
                                   "media": [uri.getImage() for uri in MopicMedia.objects.filter(mopic=obj).all()]})

        profile = {'bio': self.bio, "story": story, 'birth_date': self.birth_date, 'private': self.private,
                   'following': followings, 'friends': friends, 'fans': fans,
                   'mopics': mopics, 'rating': self.rating, "ratingView": self.ratingView, "privateComments": self.privateComments, "lastSeen": self.lastSeen}
        profile.update(image)
        if self.user.activity.connected:
            profile.update({"activity_status": True})
        else:
            profile.update(
                {"activity_status": False, "last_active": self.user.activity.datetime if not self.lastSeen else None})
        user = {'email': self.user.email, "isVisible": isFriend, 'mobile': self.mobile, 'username': self.user.username, "requested": requested, "accept": accept, "following": following, "followback": followback,
                'first_name': self.user.first_name, 'last_name': self.user.last_name, 'profile': profile}
        return user


class Activity(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE)
    token = models.TextField(blank=True, null=True)
    connected = models.BooleanField(default=False)
    datetime = models.DateTimeField(auto_now=True)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        Activity.objects.create(user=instance, token=uuid4())


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
    instance.activity.save()


class Follow(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="Follower")
    user_secondary = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="Following")
    pending = models.BooleanField(default=True)
    datetime = models.DateTimeField(default=timezone.now)
    date = models.DateTimeField(auto_now=True)


class Trophy(models.Model):
    user = models.ManyToManyField(User)
    image = models.ImageField(
        upload_to=PathAndRename(''), blank=True, null=True)
    name = models.TextField(max_length=100)


class UserOtp(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE)
    token = models.TextField(default=None, null=True)
    otp = models.IntegerField(null=True)
    datetime = models.DateTimeField(auto_now=True)
    attempts = models.IntegerField(default=0)


class TempUserToken(models.Model):
    token = models.TextField(max_length=255)
    otp = models.IntegerField()
    datetime = models.DateTimeField(auto_now=True)
    mobile = models.TextField(max_length=15, blank=True)
    email = models.TextField(max_length=255, null=True)
    isMobile = models.BooleanField(default=False)
    verified = models.BooleanField(default=False)


class LoginHistory(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE)
    loggedIn = models.BooleanField(default=True)
    token = models.TextField()
    loginTime = models.DateTimeField()
    logoutTime = models.DateTimeField(blank=True, null=True)
    device = models.TextField(blank=True, null=True)
    ip = models.TextField(blank=True, null=True)

    def getHistory(self, token=None):
        current = False
        if token == self.token:
            current = True
        return {"current": current, "device": json.loads(self.device), "ip": self.ip, "loginTime": self.loginTime, "logoutTime": self.logoutTime, "loggedIn": self.loggedIn}


class OtpAnon(models.Model):
    username = models.CharField(max_length=255)
    token = models.TextField()
    otp = models.IntegerField()
    datetime = models.DateTimeField(auto_now=True)
