from django.db import models
from uuid import uuid4
import os
from django.contrib.auth.models import User
# Create your models here.
from django.utils.deconstruct import deconstructible
import mimetypes
from io import BytesIO
from PIL import Image
from django.core.files import File
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
    im.save(im_io, 'JPEG', quality=quality)
    # create a django-friendly Files object
    new_image = File(im_io, name=image.name)
    return new_image


class Mopic(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True)
    caption = models.TextField(max_length=255)
    location = models.TextField(max_length=255)
    datetime = models.DateTimeField(default=timezone.now)
    updatetime = models.DateTimeField(auto_now=True)
    comments = models.BooleanField(default=True)


class MopicMedia(models.Model):
    mopic = models.ForeignKey(
        Mopic, on_delete=models.CASCADE, blank=True, null=True)
    media = models.FileField(
        upload_to=PathAndRename(''), blank=True, null=True)
    thumbnail = models.ImageField(
        upload_to=PathAndRename(''), blank=True, null=True)

    def getImage(self):
        return {"uri": self.media.url, "mimetype": mimetypes.guess_type(self.media.name)[0],
                "thumbnail": self.thumbnail.url if self.thumbnail else "default/mopic.png"} if self.media else {"uri": "default/mopic.png"}

    def save(self, *args, **kwargs):
        # call the compress function
        if "image" in mimetypes.guess_type(self.media.name)[0]:
            new_media = compress(self.media)
            self.media = new_media
        if self.thumbnail:
            new_thumb = compress(self.thumbnail, 50)
            self.thumbnail = new_thumb

        super().save(*args, **kwargs)


class MopicTagged(models.Model):
    mopic = models.ForeignKey(
        Mopic, on_delete=models.CASCADE, blank=True, null=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True)
    datetime = models.DateTimeField(auto_now=True)


class MopicLike(models.Model):
    mopic = models.ForeignKey(
        Mopic, on_delete=models.CASCADE, blank=True, null=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True)
    datetime = models.DateTimeField(default=timezone.now)


class MopicRate(models.Model):
    mopic = models.ForeignKey(
        Mopic, on_delete=models.CASCADE, blank=True, null=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True)
    rating = models.FloatField(default=0, blank=False)
    datetime = models.DateTimeField(default=timezone.now)


class MopicComment(models.Model):
    mopic = models.ForeignKey(
        Mopic, on_delete=models.CASCADE, blank=True, null=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True)
    comment = models.TextField(max_length=255)
    private = models.BooleanField(default=False)
    datetime = models.DateTimeField(default=timezone.now)


class MopicCommentReply(models.Model):
    commentMain = models.ForeignKey(
        MopicComment, on_delete=models.CASCADE, blank=True, null=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, blank=True, null=True)
    comment = models.TextField(max_length=255)
    datetime = models.DateTimeField(default=timezone.now)


class HashTag(models.Model):
    mopic = models.ForeignKey(
        Mopic, on_delete=models.CASCADE, blank=True, null=True)
    tag = models.TextField(default=None)
    datetime = models.DateTimeField(auto_now=True)
