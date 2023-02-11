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
from mopic.models import *
from accounts import models as Accounts
from django.db.models import Q
import datetime
from django.utils import timezone
import pandas as pd
# Math functions, we’ll only need the sqrt function so let’s import only that
from math import sqrt
import numpy as np


class GetMopicHome(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        users = [user.user_secondary for user in Accounts.Follow.objects.filter(
            user=request.user, pending=False).all()]
        users.append(request.user)
        if 'afterdatetime' in request.data.keys():
            mopic = Mopic.objects.filter(
                datetime__lt=request.data['afterdatetime'], user__in=users).all().order_by('-datetime')[:10]
        elif 'beforedatetime' in request.data.keys():
            mopic = Mopic.objects.filter(
                datetime__gt=request.data['beforedatetime'], user__in=users).all().order_by('-datetime')[:10]
        else:
            mopic = Mopic.objects.filter(
                user__in=users).all().order_by('-datetime')[:10]
        mopics = []
        for obj in mopic:
            ratings = MopicRate.objects.filter(mopic=obj).all()
            selfRate = MopicRate.objects.filter(
                mopic=obj, user=request.user).all()
            selfRate = True if len(selfRate) > 0 else False
            pc = len(MopicComment.objects.filter(
                mopic=obj, private=True).all())

            rates = 0
            for i in ratings:
                rates += i.rating
            mopics.append({"id": obj.pk, "user": obj.user.profile.get_profile(request.user), "comment_allow": obj.comments, "date": obj.datetime,
                           "liked": len(MopicLike.objects.filter(mopic=obj, user=request.user).all()) != 0,
                           "likes": len(MopicLike.objects.filter(mopic=obj).all()),
                           "comments": len(MopicComment.objects.filter(mopic=obj).all())+len(MopicCommentReply.objects.filter(commentMain__mopic=obj).all()),
                           "rating": selfRate, "location": obj.location, "caption": obj.caption,
                           "privateCount": pc, "ratingCount": len(ratings), "rate": rates/len(ratings) if len(ratings) > 0 else 0,
                           "media": [uri.getImage() for uri in MopicMedia.objects.filter(mopic=obj).all()]})

        return Response({"mopics": mopics[:10]})


class MopicCommentAllowance(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, mid=None, *args, **kwargs):
        if not mid:
            return Response(status=404)
        try:
            obj = Mopic.objects.get(pk=mid)
            obj.comments = not obj.comments
            obj.save()
            return Response(status=200)
        except:
            return Response(status=403)


def recommend(data, mopics, instance):
    main = pd.DataFrame(data)
    user = pd.DataFrame(mopics)
    userSubsetGroup = main.groupby(['uid'])
    userSubsetGroup = sorted(
        userSubsetGroup, key=lambda x: len(x[1]), reverse=True)
    userSubsetGroup = userSubsetGroup[0:100]
    pearsonCorrelationDict = {}
    # For every user group in our subset
    for name, group in userSubsetGroup:
        # Let’s start by sorting the input and current user group so the values aren’t mixed up later on
        group = group.sort_values(by='id')
        user = user.sort_values(by='id')
        # Get the N for the formula
        nRatings = len(group)
        # Get the review scores for the movies that they both have in common
        temp_df = user[user['id'].isin(group['id'].tolist())]
        # And then store them in a temporary buffer variable in a list format to facilitate future calculations
        tempRatingList = temp_df['rating'].tolist()
        # Let’s also put the current user group reviews in a list format
        tempGroupList = group['rating'].tolist()
        # Now let’s calculate the pearson correlation between two users, so called, x and y
        Sxx = sum([i**2 for i in tempRatingList]) - \
            pow(sum(tempRatingList), 2)/float(nRatings)
        Syy = sum([i**2 for i in tempGroupList]) - \
            pow(sum(tempGroupList), 2)/float(nRatings)
        Sxy = sum(i*j for i, j in zip(tempRatingList, tempGroupList)) - \
            sum(tempRatingList)*sum(tempGroupList)/float(nRatings)
        # If the denominator is different than zero, then divide, else, 0 correlation.
        if Sxx != 0 and Syy != 0:
            pearsonCorrelationDict[name] = Sxy/sqrt(Sxx*Syy)
        else:
            pearsonCorrelationDict[name] = 0
    pearsonDF = pd.DataFrame.from_dict(
        pearsonCorrelationDict, orient='index')
    pearsonDF.columns = ['similarityIndex']
    pearsonDF['uid'] = pearsonDF.index
    pearsonDF.index = range(len(pearsonDF))
    topUsers = pearsonDF.sort_values(
        by='similarityIndex', ascending=False)[0:50]

    topUsersRating = topUsers.merge(
        main, left_on='uid', right_on='uid', how='inner')
    topUsersRating['weightedRating'] = topUsersRating['similarityIndex'] * \
        topUsersRating['rating']
    tempTopUsersRating = topUsersRating.groupby(
        'id').sum()[['similarityIndex', 'weightedRating']]
    tempTopUsersRating.columns = [
        'sum_similarityIndex', 'sum_weightedRating']
    tempTopUsersRating.head()
    recommendation_df = pd.DataFrame()
    # Now we take the weighted average
    recommendation_df['weighted average recommendation score'] = tempTopUsersRating['sum_weightedRating'] / \
        tempTopUsersRating['sum_similarityIndex']
    recommendation_df['id'] = tempTopUsersRating.index
    recommendation_df = recommendation_df.sort_values(
        by='weighted average recommendation score', ascending=False)
    mopics_ = []
    mopic = list(recommendation_df['id'])
    user = instance
    for mobj in mopic:
        try:
            obj = Mopic.objects.get(pk=mobj)
        except:
            print(mobj)
            continue
        ratings = MopicRate.objects.filter(mopic=obj).all()
        selfRate = MopicRate.objects.filter(
            mopic=obj, user=user).all()
        selfRate = True if len(selfRate) > 0 else False
        pc = len(MopicComment.objects.filter(
            mopic=obj, private=True).all())

        rates = 0
        for i in ratings:
            rates += i.rating
        mopics_.append({"id": obj.pk, "user": obj.user.profile.get_profile(user), "comment_allow": obj.comments, "date": obj.datetime,
                        "liked": len(MopicLike.objects.filter(mopic=obj, user=user).all()) != 0,
                        "likes": len(MopicLike.objects.filter(mopic=obj).all()),
                        "comments": len(MopicComment.objects.filter(mopic=obj).all())+len(MopicCommentReply.objects.filter(commentMain__mopic=obj).all()),
                        "rating": selfRate, "location": obj.location, "caption": obj.caption,
                        "privateCount": pc, "ratingCount": len(ratings), "rate": rates/len(ratings) if len(ratings) > 0 else 0,
                        "media": [uri.getImage() for uri in MopicMedia.objects.filter(mopic=obj).all()]})
    return mopics_


class Recommendations(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        rated = MopicRate.objects.filter(
            user=user).all().order_by('-datetime')[:50]
        mopics = [{"id": r.mopic.pk, "text": (
            r.mopic.caption+" "+r.mopic.user.username+" "+r.mopic.location).strip().lower(), "rating": r.rating} for r in rated]
        data = []
        for rr in rated:
            rs = MopicRate.objects.filter(
                mopic=rr.mopic).all().order_by('-datetime')[:25]
            rp = [{"id": r.mopic.pk, "text": (
                r.mopic.caption+" "+r.mopic.user.username+" "+r.mopic.location).strip().lower(), "rating": r.rating, "uid": r.user.pk} for r in rs if r.user != request.user]
            data = [*data, *rp]
        recommendations = recommend(data, mopics, request.user)
        return Response({"data": recommendations})


class MopicRecommendations(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, mid, *args, **kwargs):
        try:
            mopic = Mopic.objects.get(pk=mid)
        except:
            return Response(status=404)
        rc = [rate.user for rate in MopicRate.objects.filter(
            mopic=mopic).all().order_by('-datetime')[:50]]
        rated = MopicRate.objects.filter(
            user__in=rc).all().order_by('-datetime')[:50]

        mopics = [{"id": r.mopic.pk, "text": (
            r.mopic.caption+" "+r.mopic.user.username+" "+r.mopic.location).strip().lower(), "rating": r.rating} for r in rated]
        data = []
        for rr in rated:
            rs = MopicRate.objects.filter(
                mopic=rr.mopic).all().order_by('-datetime')[:25]
            rp = [{"id": r.mopic.pk, "text": (
                r.mopic.caption+" "+r.mopic.user.username+" "+r.mopic.location).strip().lower(), "rating": r.rating, "uid": r.user.pk} for r in rs if r.mopic.pk != mopic.pk]
            data = [*data, *rp]
        recommendations = recommend(data, mopics, request.user)
        return Response({"data": recommendations})


class DeleteCommentReply(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pid=None, cid=None, *args, **kwargs):
        print(pid, cid)
        if not pid and not cid:
            return Response(status=404)
        try:
            obj = MopicCommentReply.objects.get(pk=cid, commentMain__pk=pid)
            remove = False
            print(obj)
            users = [obj.user, obj.commentMain.user,
                     obj.commentMain.mopic.user]
            if request.user in users:
                obj.delete()
                return Response(status=200)
        except:
            pass
        return Response(status=403)


class GetCommentReplies(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, cid=None, *args, **kwargs):
        if not cid:
            return Response(status=404)
        try:
            obj = MopicComment.objects.get(pk=cid)
            remove = False
            users = [obj.user, obj.user, obj.mopic.user]
            if request.user in users:
                obj.delete()
                return Response(status=200)
        except:
            pass
        return Response(status=403)

    def post(self, request, cid=None, *args, **kwargs):
        if not cid:
            return Response(status=404)
        try:
            obj = MopicComment.objects.get(pk=cid)
            reply = MopicCommentReply.objects.filter(
                commentMain=obj).all()
            comments = []
            for cmntreply in reply:
                remove = False
                users = [cmntreply.user, obj.user,
                         obj.mopic.user]
                if request.user in users:
                    remove = True
                comments.append({"id": cmntreply.pk, "comment": cmntreply.comment, "user": cmntreply.user.profile.get_profile(request.user),
                                 "datetime": cmntreply.datetime, "remove": remove})
            return Response({"data": comments})

        except:
            return Response(status=403)


class GetMopicComments(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, mid=None, *args, **kwargs):
        allowed = True
        if not mid:
            return Response(status=404)
        try:
            obj = Mopic.objects.get(pk=mid)
            allowed = obj.comments
        except:
            return Response(status=403)
        pc = len(MopicComment.objects.filter(mopic=obj, private=True).all())
        comments = []
        tagged = MopicTagged.objects.filter(mopic=obj).all()
        pview = [tagg.user for tagg in tagged]
        pview.append(obj.user)
        isp = False
        if request.user in pview:
            isp = True
        comment = MopicComment.objects.filter(Q(private=isp) | Q(
            private=True, user=request.user) | Q(private=False), mopic=obj).all()
        replies = 0
        ratings = MopicRate.objects.filter(mopic=obj).all()
        selfRate = MopicRate.objects.filter(mopic=obj, user=request.user).all()
        selfRate = selfRate[0].rating if len(selfRate) > 0 else 0
        rates = 0
        follower = Accounts.Follow.objects.filter(
            user_secondary=obj.user).all()
        following_ = Accounts.Follow.objects.filter(user=obj.user).all()
        friends = [obj.user]
        for (f, k) in zip(follower, following_):
            if f.user_secondary == k.user:
                friends.append(f.user)
        private = False
        if request.user in friends:
            private = True
        for i in ratings:
            rates += i.rating
        for cmnt in comment:
            remove = False
            users = [cmnt.user, cmnt.mopic.user]
            if request.user in users:
                remove = True
            reply = MopicCommentReply.objects.filter(
                commentMain=cmnt).all().order_by('-datetime')
            replies += len(reply)
            cmntreply = reply[0] if len(reply) > 0 else None
            if cmntreply:
                remove_ = False
                users = [cmntreply.user, cmnt.user,
                         cmnt.mopic.user]
                if request.user in users:
                    remove_ = True
                comments.append({"id": cmnt.pk, "comment": cmnt.comment, "private": cmnt.private, "user": cmnt.user.profile.get_profile(request.user), "datetime": cmnt.datetime,
                                 "remove": remove, "reply": {"comment": {"id": cmntreply.pk, "comment": cmntreply.comment, "user": cmntreply.user.profile.get_profile(request.user),
                                                                         "datetime": cmntreply.datetime, "remove": remove_}, "count": len(reply)}})
            else:
                comments.append({"id": cmnt.pk, "comment": cmnt.comment, "private": cmnt.private, "user": cmnt.user.profile.get_profile(request.user), "datetime": cmnt.datetime,
                                 "remove": remove, "reply": {"comment": None, "count": 0}})

        return Response({"comments": comments, "allowed": allowed, "private": private})


class MopicSetLike(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # def get(self, request, mid, *args, **kwargs):
    #     return Response(status=404)

    def post(self, request, mid, *args, **kwargs):
        users = [user.user_secondary for user in Accounts.Follow.objects.filter(
            user=request.user, pending=False).all()]
        users.append(request.user)
        try:
            mopic = Mopic.objects.get(pk=mid)
        except:
            return Response(status=403)
        if mopic.user not in users:
            return Response(status=403)
        try:
            liked = MopicLike.objects.get(mopic=mopic, user=request.user)
        except:
            liked = None
        if liked:
            liked.delete()
            return Response({"liked": False, "likes": len(MopicLike.objects.filter(mopic=mopic).all())})
        MopicLike.objects.create(mopic=mopic, user=request.user)
        return Response({"liked": True, "likes": len(MopicLike.objects.filter(mopic=mopic).all())})


class GetMopic(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # def get(self, request, mid, *args, **kwargs):
    #     return Response(status=404)
    def post(self, request, mid, *args, **kwargs):
        try:
            obj = Mopic.objects.get(pk=mid)
            ratings = MopicRate.objects.filter(mopic=obj).all()
            selfRate = MopicRate.objects.filter(
                mopic=obj, user=request.user).all()
            selfRate = True if len(selfRate) > 0 else False
            pc = len(MopicComment.objects.filter(
                mopic=obj, private=True).all())

            rates = 0
            for i in ratings:
                rates += i.rating
            return Response({"id": obj.pk, "user": obj.user.profile.get_profile(request.user), "comment_allow": obj.comments, "date": obj.datetime,
                             "liked": len(MopicLike.objects.filter(mopic=obj, user=request.user).all()) != 0,
                             "likes": len(MopicLike.objects.filter(mopic=obj).all()),
                             "comments": len(MopicComment.objects.filter(mopic=obj).all())+len(MopicCommentReply.objects.filter(commentMain__mopic=obj).all()),
                             "rating": selfRate, "location": obj.location, "caption": obj.caption,
                             "privateCount": pc, "ratingCount": len(ratings), "rate": rates/len(ratings) if len(ratings) > 0 else 0,
                             "media": [uri.getImage() for uri in MopicMedia.objects.filter(mopic=obj).all()]})
        except:
            return Response(status=403)

    def delete(self, request, mid, *args, **kwargs):
        try:
            mopic = Mopic.objects.get(pk=mid)
            if mopic.user == request.user:
                mopic.delete()
                return Response(status=200)
            return Response(status=403)
        except:
            return Response(status=403)


class MopicLikes(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # def get(self, request, mid, *args, **kwargs):
    #     return Response(status=404)

    def post(self, request, mid, *args, **kwargs):
        try:
            mopic = Mopic.objects.get(pk=mid)
            likes_ = MopicLike.objects.filter(mopic=mopic).all()
            likes = [like.user.profile.get_profile(
                request.user) for like in likes_]
            return Response({"data": likes})
        except:
            return Response(status=403)


class MopicRatings(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # def get(self, request, mid, *args, **kwargs):
    #     return Response(status=404)

    def post(self, request, mid, *args, **kwargs):
        try:
            mopic = Mopic.objects.get(pk=mid)
            if mopic.user.profile.ratingView:
                ratings_ = MopicRate.objects.filter(mopic=mopic).all()
                ratings = [{"user": rating.user.profile.get_profile(
                    request.user), "rating": rating.rating} for rating in ratings_]
                return Response({"data": ratings})
        except:
            pass
        return Response(status=403)


class SelfMopicRatings(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # def get(self, request, mid, *args, **kwargs):
    #     return Response(status=404)

    def post(self, request, *args, **kwargs):
        s_5 = len(MopicRate.objects.filter(Q(rating__gt=4), user=request.user))
        s_4 = len(MopicRate.objects.filter(Q(rating__gt=3)
                                           & Q(rating__lt=4.1), user=request.user))
        s_3 = len(MopicRate.objects.filter(Q(rating__gt=2)
                                           & Q(rating__lt=3.1), user=request.user))
        s_2 = len(MopicRate.objects.filter(Q(rating__gt=1)
                                           & Q(rating__lt=2.1), user=request.user))
        s_1 = len(MopicRate.objects.filter(Q(rating__gt=0)
                                           & Q(rating__lt=1.1), user=request.user))
        return Response({"ratings": [s_1, s_2, s_3, s_4, s_5]})


class MopicLiked(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # def get(self, request, mid, *args, **kwargs):
    #     return Response(status=404)

    def post(self, request, *args, **kwargs):
        if 'afterdatetime' in request.data.keys():
            mopics = MopicLike.objects.filter(
                datetime__lt=request.data['afterdatetime'], user=request.user).all().order_by('-datetime')[:10]
        else:
            mopics = MopicLike.objects.filter(
                user=request.user).order_by('-datetime')
        mopic = []
        for liked in mopics:
            obj = liked.mopic
            ratings = MopicRate.objects.filter(mopic=obj).all()
            selfRate = MopicRate.objects.filter(
                mopic=obj, user=request.user).all()
            selfRate = True if len(selfRate) > 0 else False
            pc = len(MopicComment.objects.filter(
                mopic=obj, private=True).all())

            rates = 0
            for i in ratings:
                rates += i.rating
            mopic.append({"id": obj.pk, "user": obj.user.profile.get_profile(request.user), "comment_allow": obj.comments, "date": obj.datetime,
                          "liked": len(MopicLike.objects.filter(mopic=obj, user=request.user).all()) != 0,
                          "likes": len(MopicLike.objects.filter(mopic=obj).all()),
                          "comments": len(MopicComment.objects.filter(mopic=obj).all())+len(MopicCommentReply.objects.filter(commentMain__mopic=obj).all()),
                          "rating": selfRate, "location": obj.location, "caption": obj.caption,
                          "privateCount": pc, "ratingCount": len(ratings), "rate": rates/len(ratings) if len(ratings) > 0 else 0,
                          "media": [uri.getImage() for uri in MopicMedia.objects.filter(mopic=obj).all()]})
        return Response({"mopics": mopic[:20]})


class MopicSetRate(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # def get(self, request, mid, *args, **kwargs):
    #     return Response(status=404)

    def post(self, request, mid, *args, **kwargs):
        users = [user.user_secondary for user in Accounts.Follow.objects.filter(
            user=request.user, pending=False).all()]
        users.append(request.user)
        try:
            mopic = Mopic.objects.get(pk=mid)
        except:
            return Response(status=403)
        if mopic.user not in users:
            return Response(status=403)
        if 'rate' not in request.data.keys():
            return Response(status=404)

        rate = MopicRate.objects.update_or_create(mopic=mopic, user=request.user, defaults={
                                                  "mopic": mopic, "user": request.user, "rating": request.data['rate']})
        ratings = MopicRate.objects.filter(mopic=mopic).all()
        rates = 0
        for i in ratings:
            rates += i.rating
        return Response({"rate": rates/len(ratings) if len(ratings) > 0 else 0, "count": len(ratings)})


class PostComment(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    # def get(self, request, mid, *args, **kwargs):
    #     return Response(status=404)

    def post(self, request, mid, *args, **kwargs):
        if 'comment' in request.data.keys():

            users = [user.user_secondary for user in Accounts.Follow.objects.filter(
                user=request.user, pending=False).all()]
            users.append(request.user)
            try:
                mopic = Mopic.objects.get(pk=mid)
            except:
                return Response(status=403)
            if mopic.user not in users:
                return Response(status=403)
            if not mopic.comments:
                return Response(status=403)
            if 'reply' in request.data.keys():
                if request.data['reply'] and 'rid' in request.data.keys():
                    cmnt = MopicComment.objects.get(pk=request.data['rid'])
                    reply = MopicCommentReply.objects.filter(
                        comment=cmnt).all().order_by('-datetime')
                    cmntreply = MopicCommentReply.objects.create(
                        commentMain=cmnt, user=request.user, comment=request.data['comment'])
                    return Response({"comment": {"id": cmnt.pk, "comment": cmnt.comment, "user": cmnt.user.profile.get_profile(request.user), "datetime": cmnt.datetime,
                                                 "reply": {"comment": {"id": cmntreply.pk, "comment": cmntreply.comment, "user": cmntreply.user.profile.get_profile(request.user),
                                                                       "datetime": cmntreply.datetime}, "count": len(reply)}}})
            private = False
            if 'private' in request.data.keys():
                private = request.data['private']
            cmnt = MopicComment.objects.create(
                mopic=mopic, user=request.user, comment=request.data['comment'], private=private)
            return Response({"comment": {"id": cmnt.pk, "comment": cmnt.comment, "user": cmnt.user.profile.get_profile(request.user), "datetime": cmnt.datetime,
                                         "reply": {"comment": None, "count": 0}}})
        else:
            return Response(404)


class CreateMopic(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        caption, location, media = "", "",  0
        if 'caption' in request.data.keys():
            caption = request.data['caption']
        if 'location' in request.data.keys():
            location = request.data['location']
        if 'media' in request.data.keys():
            media = request.data['media']
        else:
            return Response(status=403)
        mopic = Mopic.objects.create(
            user=request.user, caption=caption, location=location)
        # mopic = False
        if mopic:
            if caption:
                users = [caption.strip(
                    "@") for caption in caption.split() if caption.startswith("@")]
                tagged = []
                for user in users:
                    try:
                        tagged.append(User.objects.get(username=user))
                    except:
                        pass

                tags = [caption.strip(
                    "#") for caption in caption.split() if caption.startswith("#")]

                for tag in tags:
                    tgs = tag.split("#")
                    for tag in tgs:
                        HashTag.objects.create(mopic=mopic, tag=tag)
                for user in tagged:
                    MopicTagged.objects.create(mopic=mopic, user=user)

            for i in range(0, int(media)):
                if 'media'+str(i) in request.data.keys():
                    if 'thumbnail'+str(i) in request.data.keys():
                        MopicMedia.objects.create(
                            mopic=mopic, media=request.data['media'+str(i)], thumbnail=request.data['thumbnail'+str(i)])
                    else:
                        MopicMedia.objects.create(
                            mopic=mopic, media=request.data['media'+str(i)])
            obj = mopic
            return Response({"id": obj.pk, "user": obj.user.profile.get_profile(request.user), "comment_allow": obj.comments, "date": obj.datetime,
                             "liked": False,
                             "likes": 0,
                             "comments": 0,
                             "rating": False, "location": obj.location, "caption": obj.caption,
                             "privateCount": 0, "ratingCount": 0, "rate": 0,
                             "media": [uri.getImage() for uri in MopicMedia.objects.filter(mopic=obj).all()]})
        else:
            return Response(status=500)


class MopicTrends(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        time_threshold = timezone.now() - datetime.timedelta(hours=12)
        mopicsLikes = MopicLike.objects.filter(
            mopic__user__profile__private=False, datetime__gt=time_threshold).all()
        mopicsRates = MopicRate.objects.filter(
            mopic__user__profile__private=False, datetime__gt=time_threshold).all()
        mopics = {}
        for obj in mopicsRates:
            if 'mopic__'+str(obj.mopic.pk) in mopics.keys():
                mopics['mopic__'+str(obj.mopic.pk)] = {"mopic": obj.mopic,
                                                       "rate": mopics['mopic__'+str(obj.mopic.pk)]['rate']+obj.rating,
                                                       "like": mopics['mopic__'+str(obj.mopic.pk)]['like']}
            else:
                mopics['mopic__' + str(obj.mopic.pk)] = {"mopic": obj.mopic,
                                                         "rate": obj.rating, "like": 0}
        for obj in mopicsLikes:
            if 'mopic__'+str(obj.mopic.pk) in mopics.keys():
                mopics['mopic__'+str(obj.mopic.pk)] = {"mopic": obj.mopic,
                                                       "rate": mopics['mopic__'+str(obj.mopic.pk)]['rate'],
                                                       "like": mopics['mopic__'+str(obj.mopic.pk)]['like']+1}
            else:
                mopics['mopic__'+str(obj.mopic.pk)] = {"mopic": obj.mopic,
                                                       "rate": 0, "like": 1}
        for key, mopic in mopics.items():
            if type(mopic) == dict:
                try:
                    rate = mopic['rate'] / \
                        len(MopicRate.objects.filter(mopic=mopic['mopic']))
                except:
                    rate = 0.1
                try:
                    like = mopic['like'] / \
                        len(MopicRate.objects.filter(mopic=mopic['mopic']))
                except:
                    like = 1
                ratio = (rate*like)/100
                mopics['mopic__' +
                       str(mopic['mopic'].pk)] = {"mopic": mopic['mopic'], "ratio": ratio}
            else:
                mopics.pop(key)
        trends = sorted(
            mopics.items(), key=lambda x: x[1]['ratio'], reverse=True)[:10]
        trends = [x[1]['mopic'] for x in trends]
        trending = []
        ti = 0
        for obj in trends:
            ti += 1
            ratings = MopicRate.objects.filter(mopic=obj).all()
            selfRate = MopicRate.objects.filter(
                mopic=obj, user=request.user).all()
            selfRate = True if len(selfRate) > 0 else False
            rates = 0
            for i in ratings:
                rates += i.rating
            trending.append({"id": obj.pk, "user": obj.user.profile.get_profile(request.user), "date": obj.datetime, "rate": rates/len(ratings) if len(ratings) > 0 else 0,
                             "rating": selfRate, "trending": ti,
                             "likes": len(MopicLike.objects.filter(mopic=obj).all()), "comments": obj.comments, "liked": len(MopicLike.objects.filter(mopic=obj, user=request.user).all()) != 0,
                             "media": [uri.getImage() for uri in MopicMedia.objects.filter(mopic=obj).all()]})
        tags = {}
        time_threshold = timezone.now() - datetime.timedelta(hours=6)
        hashtags = HashTag.objects.filter(
            datetime__gt=time_threshold).all().order_by("-datetime")
        for tag in hashtags:
            if tag.tag:
                rate = MopicRate.objects.filter(mopic=tag.mopic).all()
                rates = 0
                for i in rate:
                    rates += i.rating
                rate_ = rates/len(rate) if len(rate) > 0 else 0
                if tag.tag in tags:
                    tags[tag.tag] = tags[tag.tag]+rate_
                else:
                    tags[tag.tag] = rate_
        trends = sorted(
            tags.items(), key=lambda x: x[1], reverse=True)[:50]
        # trends = [x[0] for x in trends][:50]
        hashTrends = []
        for t in trends:
            c = HashTag.objects.filter(
                datetime__lt=time_threshold, tag=t[0]).all()
            ratio = 0
            for tc in c:
                rate = MopicRate.objects.filter(mopic=tc.mopic).all()
                rates = 0
                for i in rate:
                    rates += i.rating
                rate_ = rates/len(rate) if len(rate) > 0 else 0
                ratio = ratio+rate_
            if t[1] >= ratio:
                hashTrends.append(t[0])
        return Response({"trends": trending, "hash": hashTrends[:10]})
