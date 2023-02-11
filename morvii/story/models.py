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
    im = im.convert("RGB")
    im_io = BytesIO()
    # save image to BytesIO object
    im.save(im_io, 'JPEG', quality=quality)
    # create a django-friendly Files object
    new_image = File(im_io, name=image.name)
    return new_image


class Story(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE)
    media = models.FileField(
        upload_to=PathAndRename(''), blank=True, null=True)

    datetime = models.DateTimeField(default=timezone.now)

    def getMedia(self):
        return {"uri": self.media.url, "mediaType": mimetypes.guess_type(self.media.name)[0]} if self.media else None

    def save(self, *args, **kwargs):
        # call the compress function
        if "image" in mimetypes.guess_type(self.media.name)[0]:
            new_media = compress(self.media)
            self.media = new_media

        super().save(*args, **kwargs)

# class StoryProps(models.Model):
#     story = models.ForeignKey(Story,on_delete=models.CASCADE)


class StoryView(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE)
    story = models.ForeignKey(
        Story, on_delete=models.CASCADE)
    datetime = models.DateTimeField(auto_now=True)
