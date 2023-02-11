from django.db import models
from uuid import uuid4
import os
import json
from django.contrib.auth.models import User
# Create your models here.
from django.utils.deconstruct import deconstructible
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import mimetypes
from io import BytesIO
from PIL import Image
from django.db.models import Q
from django.core.files import File
from story.models import Story
from mopic.models import *
from accounts.models import *
from django.utils import timezone


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


def compress(image, quality=60):
    im = Image.open(image)
    # create a BytesIO object
    im_io = BytesIO()
    # save image to BytesIO object
    im.save(im_io, 'PNG', quality=quality)
    # create a django-friendly Files object
    new_image = File(im_io, name=image.name)
    return new_image


class Messenger(models.Model):
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True, related_name="Sender")
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True, related_name="Receiver")
    sent = models.BooleanField(default=False)
    seen = models.BooleanField(default=False)
    message = models.TextField(blank=True, null=True)
    messageReply = models.ForeignKey(
        to="self", on_delete=models.CASCADE, blank=True, null=True)
    story = models.ForeignKey(
        Story, on_delete=models.CASCADE, blank=True, null=True)
    mopic = models.ForeignKey(
        Mopic, on_delete=models.CASCADE, blank=True, null=True)
    media = models.FileField(
        upload_to=PathAndRename(''), blank=True, null=True)
    datetime = models.DateTimeField(default=timezone.now)
    sticker = models.TextField(blank=True, null=True)
    gif = models.TextField(blank=True, null=True)

    def get_message(self, instance):
        obj = self.mopic
        mopics = None
        if obj:
            ratings = MopicRate.objects.filter(mopic=obj).all()
            selfRate = MopicRate.objects.filter(
                mopic=obj, user=instance).all()
            selfRate = True if len(selfRate) > 0 else False
            pc = len(MopicComment.objects.filter(
                mopic=obj, private=True).all())

            rates = 0
            for i in ratings:
                rates += i.rating
            mopics = {"id": obj.pk, "user": obj.user.profile.get_profile(instance), "date": str(obj.datetime).replace(" ", "T"),
                      "liked": len(MopicLike.objects.filter(mopic=obj, user=instance).all()) != 0,
                      "likes": len(MopicLike.objects.filter(mopic=obj).all()),
                      "comments": len(MopicComment.objects.filter(mopic=obj).all())+len(MopicCommentReply.objects.filter(commentMain__mopic=obj).all()),
                      "rating": selfRate, "location": obj.location, "caption": obj.caption,
                      "privateCount": pc, "ratingCount": len(ratings), "rate": rates/len(ratings) if len(ratings) > 0 else 0,
                      "media": [uri.getImage() for uri in MopicMedia.objects.filter(mopic=obj).all()]}
        return json.loads(json.dumps({"id": self.pk, "message": self.message,
                                      "sticker": self.sticker, "gif": self.gif,
                                      "media": {"uri": self.media.url,
                                                "mediaType": mimetypes.guess_type(self.media.name)[0]} if self.media else None, "seen": self.seen, "sent": self.sent,
                                      "datetime": str(self.datetime).replace(" ", "T"), "sender": self.sender.username, "mopic": mopics,
                                      "receiver": self.receiver.username, "story": {"user": self.story.user.profile.get_profile(instance), "media": self.story.getMedia()} if self.story else None,
                                      "reply": self.messageReply.get_message(instance) if self.messageReply else None}, indent=4, sort_keys=True, default=str))

    def save(self, *args, **kwargs):
        # call the compress function
        if self.media:
            if "image" in mimetypes.guess_type(self.media.name)[0]:
                new_media = compress(self.media)
                self.media = new_media

        super().save(*args, **kwargs)


@receiver(post_save, sender=Messenger)
def save_last_message(sender, instance, created, **kwargs):
    if created:
        messages = Messages.objects.filter(Q(user_1=instance.sender, user_2=instance.receiver) | Q(
            user_2=instance.sender, user_1=instance.receiver)).all()[:1]
        message = messages[0] if len(messages) > 0 else None
        isInboxed = len(InboxType.objects.filter(Q(user=instance.sender, user_secondary=instance.receiver) | Q(
            user_secondary=instance.sender, user=instance.receiver)).all()) < 2
        if isInboxed:
            isFriend = False
            isFriend = instance.receiver == instance.sender
            follower = Follow.objects.filter(
                user_secondary=instance.receiver).all()
            fuser = [f.user for f in follower]
            if instance.receiver in fuser:
                isFriend = True
            InboxType.objects.create(
                user=instance.sender, user_secondary=instance.receiver, primary=isFriend)
            isFriend = instance.receiver == instance.sender
            follower = Follow.objects.filter(
                user_secondary=instance.sender).all()
            fuser = [f.user for f in follower]
            if instance.sender in fuser:
                isFriend = True
            InboxType.objects.create(
                user=instance.receiver, user_secondary=instance.sender, primary=isFriend)
        if message:
            message.message = instance
            message.save()
        else:
            Messages.objects.create(
                user_1=instance.sender, user_2=instance.receiver, message=instance)


@receiver(post_delete, sender=Messenger)
def update_last_message(sender, instance, **kwargs):
    messages = Messages.objects.filter(Q(user_1=instance.sender, user_2=instance.receiver) | Q(
        user_2=instance.sender, user_1=instance.receiver)).all()[:1]
    message = messages[0] if len(messages) > 0 else None
    # print(message)
    if not message:
        # print(instance, ":=")
        instance__ = Messenger.objects.filter(Q(sender=instance.sender, receiver=instance.receiver) | Q(
            receiver=instance.sender, sender=instance.receiver)).all().order_by('-datetime')
        instance_ = instance__[0] if len(instance__) > 0 else None
        # print(instance_, "::")
        if instance_:
            print(instance_)
            Messages.objects.create(
                user_1=instance_.sender, user_2=instance_.receiver, message=instance_)


class Messages(models.Model):
    user_1 = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True, related_name="user_1")
    user_2 = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True, related_name="user_2")
    message = models.ForeignKey(
        Messenger, on_delete=models.CASCADE, blank=True, null=True)

    def getInboxType(self, instance):
        it = InboxType.objects.filter(
            user=instance, user_secondary=self.user_2 if self.user_1 == instance else self.user_1).all()[:1]
        if len(it) > 0:
            return it[0].primary
        return False


class InboxType(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True, related_name="user_inbox")
    user_secondary = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True, related_name="user_secondary_inbox")
    primary = models.BooleanField(default=False)


class MessengerTheme(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True)
    public = models.BooleanField(default=True)
    name = models.CharField(max_length=100)
    bg = models.CharField(max_length=100)
    bgDark = models.CharField(max_length=100)
    bgLight = models.CharField(max_length=100)
    color = models.CharField(max_length=100)
    hint = models.CharField(max_length=100)
    gradient = models.CharField(max_length=255)
    secondary = models.CharField(max_length=100)
    primary = models.CharField(max_length=100)
    secondaryAccent = models.CharField(max_length=100)
    primaryAccent = models.CharField(max_length=100)
    secondaryAccentHint = models.CharField(max_length=100)
    primaryAccentHint = models.CharField(max_length=100)
    datetime = models.DateTimeField(auto_now=True)
    preview = models.ImageField(
        upload_to=PathAndRename(''), blank=True, null=True)
    background = models.ImageField(
        upload_to=PathAndRename(''), blank=True, null=True)
    header = models.ImageField(
        upload_to=PathAndRename(''), blank=True, null=True)
    footer = models.ImageField(
        upload_to=PathAndRename(''), blank=True, null=True)

    def generateTheme(self):
        return {"id": self.pk,
                "name": self.name,
                "preview": self.preview.url if self.preview else None,
                "bg": {"backgroundColor": self.bg},
                "bgDark": {"backgroundColor": self.bgDark},
                "bgLight": {"backgroundColor": self.bgLight},
                "color": {"color": self.color, "tintColor": self.color},
                "hint": {"color": self.hint},
                "image": self.background.url if self.background else None,
                "footerImage": self.footer.url if self.footer else None,
                "headerImage": self.header.url if self.header else None,
                "gradient": [x for x in self.gradient.split("@")],
                "secondary": self.secondary,
                "primary": self.primary,
                "secondaryAccent": self.secondaryAccent,
                "primaryAccent": self.primaryAccent,
                "secondaryAccentHint": self.secondaryAccentHint,
                "primaryAccentHint": self.primaryAccentHint,
                "views": len(ThemeData.objects.filter(theme=self).all())}

    def save(self, *args, **kwargs):
        # call the compress function
        if self.preview:
            if "image" in mimetypes.guess_type(self.preview.name)[0]:
                new_media = compress(self.preview)
                self.preview = new_media

        if self.background:
            if "image" in mimetypes.guess_type(self.background.name)[0]:
                new_media = compress(self.background)
                self.background = new_media
        if self.header:
            if "image" in mimetypes.guess_type(self.header.name)[0]:
                new_media = compress(self.header)
                self.header = new_media
        if self.footer:
            if "image" in mimetypes.guess_type(self.footer.name)[0]:
                new_media = compress(self.footer)
                self.footer = new_media

        super().save(*args, **kwargs)


class ThemeData(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True, related_name="theme_user")
    user_secondary = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True, related_name="theme_user_sec")
    theme = models.ForeignKey(
        MessengerTheme, on_delete=models.CASCADE, null=True)
    datetime = models.DateTimeField(auto_now=True)
