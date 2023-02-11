from re import sub
from axes.middleware import get_failures, get_username
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
from accounts.models import Follow, Trophy, UserOtp, LoginHistory, TempUserToken, OtpAnon
from django.db.models import Q
import requests
from django.utils import timezone
from django.contrib.auth import signals
import random
import datetime
import math
from uuid import uuid4
import requests


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def create_response(response, attempts):
    if attempts == 7:
        return response+", Locking Account after 2 attempts!"
    elif attempts == 8:
        return response+", Locking Account after this attempt!"
    else:
        return response+"!"


def mask_email(email):
    username, domain, *subdomains = re.split('@|.', email)
    username = username[:2]+"*"*(len(username) -
                                 4) if len(username) > 5 else username[:2]+"*"*4
    domain = "*"*len(domain)
    subdomain = '.'.join(subdomains)
    return '{}@{}.{}'.format(username, domain, subdomain)


def mask_mobile(mobile):
    return "*"*(len(mobile)-2)+str(str(mobile)[-2:])


class OtpLogin(APIView):
    def post(self, request, *args, **kwargs):
        if 'username' not in request.data.keys():
            return Response({"detail": "Username is Required!"}, status=403)
        username = get_username(request, verify=True)

        if username['isUser']:
            user = User.objects.get(username=username['username'])
            token = uuid4()
            otp_ = random.randint(111111, 999999)
            otp, created = UserOtp.objects.get_or_create(user=user)
            if otp.attempts < 10:
                print(otp_)
                otp.attempts = otp.attempts+1
                otp.otp = otp_
                otp.token = token
                otp.save()
            elif otp.datetime < timezone.now()-datetime.timedelta(hours=1):
                print(otp_, "renew")
                otp.attempts = 1
                otp.otp = otp_
                otp.token = token
                otp.save()
            else:
                return Response({"detail": "OTP Login Locked due to too many requests", "locked": True}, status=403)
            return Response({"email": mask_email(user.email) if user.email else None,
                             "mobile": mask_mobile(user.profile.mobile) if user.profile.mobile else None, "token": token, "attempts": otp.attempts})

        return Response({"detail": "Username is Required!"}, status=403)


class LoginTokenFromOtp(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        if 'username' not in request.data.keys() and 'password' in request.data.keys() and 'token' in request.data.keys():
            return Response({"detail": "OTP Required!"}, status=403)
        username = get_username(request, verify=True)

        if username['isUser']:

            timedelta = timezone.now() - datetime.timedelta(minutes=5)
            try:
                user = UserOtp.objects.get(
                    user__username=username['username'], token=request.data['token'], otp=request.data['password'])
                if user.datetime < timedelta:
                    return Response({"detail": "OTP Expired"}, status=403)
                if user:
                    user.attempts = 0
                    user.otp = None
                    user.token = None
                    user.datetime = timezone.now() - datetime.timedelta(hours=1)
                    user.save()
                    ip = get_client_ip(request)
                    deviceInfo = {}
                    if 'deviceDetails' in request.data.keys():
                        deviceInfo = request.data['deviceDetails']
                    token, created = Token.objects.get_or_create(
                        user=user.user)
                    LoginHistory.objects.create(user=user.user, loggedIn=True, token=token, loginTime=timezone.now(
                    ), device=json.dumps(deviceInfo), ip=ip)
                    return Response({
                        'token': token.key,
                        'user': user.user.profile.get_profile(user.user)
                    })
            except Exception as e:
                return Response({"detail": "Invalid OTP! "}, status=403)

        return Response({"detail": "Invalid OTP "}, status=403)


class PasswordResetToken(APIView):
    def post(self, request, *args, **kwargs):
        if 'username' not in request.data.keys() and 'password' in request.data.keys() and 'token' in request.data.keys():
            return Response({"detail": "OTP Required!"}, status=403)
        username = get_username(request, verify=True)

        if username['isUser']:

            timedelta = timezone.now() - datetime.timedelta(minutes=5)
            try:
                user = UserOtp.objects.get(
                    user__username=username['username'], token=request.data['token'], otp=request.data['password'])
                if user.datetime < timedelta:
                    return Response({"detail": "OTP Expired"}, status=403)
                if user:
                    token = uuid4()
                    user.attempts = 0
                    user.otp = None
                    user.token = token
                    user.save()
                    return Response({'token': token, })
            except Exception as e:
                return Response({"detail": "Invalid OTP ! "}, status=403)

        return Response({"detail": " Invalid OTP "}, status=403)


class PasswordReset(APIView):
    def post(self, request, *args, **kwargs):
        if 'username' not in request.data.keys() and 'password' in request.data.keys() and 'token' in request.data.keys():
            return Response({"detail": "Password Required!"}, status=403)
        username = get_username(request, verify=True)

        if username['isUser']:

            timedelta = timezone.now() - datetime.timedelta(minutes=30)
            try:
                user = UserOtp.objects.get(
                    user__username=username['username'], token=request.data['token'])
                if user.datetime < timedelta:
                    return Response({"detail": "Password Reset Token Expired"}, status=403)
                if user:
                    user.attempts = 0
                    user.otp = None
                    user.token = None
                    user.datetime = timezone.now() - datetime.timedelta(hours=1)
                    user.save()
                    user.user.set_password(str(request.data['password']))
                    user.user.save()
                    if 'login' in request.data.keys():
                        if request.data['login']:
                            ip = get_client_ip(request)
                            deviceInfo = {}
                            if 'deviceDetails' in request.data.keys():
                                deviceInfo = request.data['deviceDetails']
                            token, created = Token.objects.get_or_create(
                                user=user.user)
                            LoginHistory.objects.create(user=user.user, loggedIn=True, token=token, loginTime=timezone.now(
                            ), device=json.dumps(deviceInfo), ip=ip)
                            return Response({
                                'token': token.key,
                                'user': user.user.profile.get_profile(user.user)
                            })
                    return Response({"detail": True}, status=200)
            except Exception as e:
                return Response({"detail": "Token Expired"}, status=403)

        return Response({"detail": "Token Expired!"}, status=403)


class Login(ObtainAuthToken):

    def post(self, request, *args, **kwargs):
        if 'username' not in request.data.keys() or 'password' not in request.data.keys():
            return Response({"detail": "Username or Password is Required!"}, status=403)
        username = get_username(request)
        failed_attempts = get_failures(
            request, {"username": username})
        serializer = self.serializer_class(data={"username": username, "password": request.data['password']},
                                           context={'request': request})
        isValid = serializer.is_valid(raise_exception=False)
        if not isValid:
            return Response({"detail": create_response("Invalid Username or Password", failed_attempts), "attempts": failed_attempts}, status=403)

        ip = get_client_ip(request)
        deviceInfo = {}
        if 'deviceDetails' in request.data.keys():
            deviceInfo = request.data['deviceDetails']
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        LoginHistory.objects.create(user=user, loggedIn=True, token=token, loginTime=timezone.now(
        ), device=json.dumps(deviceInfo), ip=ip)
        return Response({
            'token': token.key,
            'user': user.profile.get_profile(user)
        })


class FCMToken(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def put(self, request, *args, **kwargs):
        if 'token' in request.data.keys():
            request.user.profile.fcm = request.data['token']
            request.user.save()
        return Response(status=200)


class CheckUsername(APIView):
    def post(self, request, *args, **kwargs):
        if "username" in request.data.keys():
            username = request.data['username']
            users = len(User.objects.filter(username=username).all())
            if users > 0:
                return Response({"detail": "Username already exists"}, status=404)

            if len(username) > 5:
                return Response({"username": username}, status=200)
            return Response({"detail": "Username already exists"}, status=404)
        else:
            return Response(status=404)


class VerifyMobile(APIView):
    def post(self, request, *args, **kwargs):
        if "mobile" in request.data.keys():
            mobile = request.data['mobile']
            users = []
            if len(users) > 0:
                return Response({"detail": "User with %s already exists" % mobile}, status=400)

            if mobile:
                if (10 <= len(mobile) < 12):
                    token = uuid4()
                    otp = random.randint(111111, 999999)
                    TempUserToken.objects.create(
                        token=token, otp=otp, mobile=mobile, isMobile=True)
                    resp = requests.get(url="https://www.pay2all.in/web-api/send_sms?api_token=mFnxVZLjFiKjuCtrs3snaR7vMR70OHyzgc3CL2B13yivAztxgEDOENL7YzfC&senderid=OPMRVI&number="+mobile+"&message=" +
                                        str(otp)+" is your OTP for creating New Morvii Account, valid for 5 minutes.&route=4")
                    return Response({"token": token}, status=200)
            return Response({"detail": "Invalid Mobile No."}, status=403)
        else:
            return Response(status=404)


class VerifyMail(APIView):
    def post(self, request, *args, **kwargs):
        if "mail" in request.data.keys():
            regex = "(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])"
            mail = request.data['mail']
            users = []
            if len(users) > 0:
                return Response({"detail": "User with %s already exists" % mail}, status=400)

            if mail:
                if re.search(regex, mail):
                    token = uuid4()
                    otp = random.randint(111111, 999999)

                    TempUserToken.objects.create(
                        token=token, otp=otp, email=mail, isMobile=False)
                    print(otp)
                    return Response({"token": token}, status=200)
            return Response({"detail": "Invalid Email ID"}, status=403)
        else:
            return Response(status=404)


class VerifyOTP(APIView):
    def post(self, request, *args, **kwargs):
        if "token" in request.data.keys() and "otp" in request.data.keys():
            token = request.data['token']
            otp = request.data['otp']
            if token:
                tempUser = TempUserToken.objects.filter(token=token, otp=otp)
                if len(tempUser) > 0:
                    if (timezone.now()-tempUser[0].datetime).seconds > 300:
                        otp = random.randint(111111, 999999)
                        tempUser[0].otp = otp
                        tempUser[0].save()
                        if tempUser[0].isMobile:
                            resp = requests.get(url="https://www.pay2all.in/web-api/send_sms?api_token=mFnxVZLjFiKjuCtrs3snaR7vMR70OHyzgc3CL2B13yivAztxgEDOENL7YzfC&senderid=OPMRVI&number="+tempUser[0].mobile+"&message=" +
                                                str(otp)+" is your OTP for creating New Morvii Account, valid for 5 minutes.&route=4")
                        else:
                            print(otp)
                        return Response({"detail": "New Sent as Previous Expired!"}, status=400)
                    elif str(otp) == str(tempUser[0].otp):
                        tempUser[0].verified = True
                        tempUser[0].save()
                        return Response({"token": token}, status=200)
                    else:
                        return Response({"detail": "Invalid OTP"}, status=403)

            return Response({"detail": "Invalid OTP!"}, status=403)
        else:
            return Response(status=404)


class Register(APIView):
    def post(self, request, *args, **kwargs):
        if "token" in request.data.keys() and "password" in request.data.keys():
            token = request.data['token']
            password = request.data['password']
            username = request.data['username']
            isMobile = request.data['isMobile']
            users = User.objects.filter(username=username).all()
            if len(users) > 0:
                return Response({"detail": "Username is already taken"}, status=403)
            if token:
                tempUser = TempUserToken.objects.filter(token=token)
                if len(tempUser) > 0:
                    if tempUser[0].verified:
                        if password[0] == password[1]:
                            if re.search('^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$', password[0]):
                                rid = requests.post(
                                    "https://api.giphy.com/v1/randomid?api_key=BLp12AJExkJK21EMAJeLxSF6IS3YgTwP")
                                try:
                                    rid = rid.json()['data']['random_id']
                                except:
                                    rid = None
                                if not isMobile:
                                    user = User.objects.create_user(username=username,
                                                                    email=request.data['email'],
                                                                    password=password[0])
                                else:
                                    user = User.objects.create_user(username=username,
                                                                    password=password[0])
                                    user.profile.mobile = request.data['mobile']
                                    user.profile.giphy = rid
                                    user.save()
                                ip = get_client_ip(request)
                                deviceInfo = {}
                                if 'deviceDetails' in request.data.keys():
                                    deviceInfo = request.data['deviceDetails']
                                token, created = Token.objects.get_or_create(
                                    user=user)
                                LoginHistory.objects.create(user=user, loggedIn=True, token=token, loginTime=timezone.now(
                                ), device=json.dumps(deviceInfo), ip=ip)
                                return Response({"token": token.key, "user": user.profile.get_profile(user)}, status=200)
                            else:
                                return Response({"detail": "Passwords Don't Match Security Rules"}, status=400)
                        else:
                            return Response({"detail": "Passwords Don't Match"}, status=403)
                    else:
                        return Response({"detail": "User Verification Failed!"}, status=403)

            return Response({"detail": "Registration Failed, Please Retry!"}, status=403)
        else:
            return Response(status=404)


class Security(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def put(self, request,  *args, **kwargs):
        if 'passwordNew' in request.data.keys():
            if 'password' in request.data.keys():
                if request.user.check_password(request.data['password']):
                    request.user.set_password(request.data['passwordNew'])
                    request.user.save()
                    return Response(200)
                return Response(status=403)
            if 'otp' in request.data.keys():
                try:
                    match = request.user.userotp.otp == request.data['otp']
                    if match:
                        request.user.set_password(request.data['passwordNew'])
                        request.user.save()
                        return Response(200)
                    else:
                        return Response(status=403)
                except:
                    return Response(status=403)
        return Response(status=404)


class SendFollow(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        if 'user' in request.data:
            user = User.objects.filter(username=request.data['user']).all()[:1]
            if len(user) > 0:
                user = user[0]
                follow = Follow.objects.filter(
                    user=request.user, user_secondary=user).all()[:1]
                if len(follow) == 0:
                    follow = Follow.objects.create(
                        user=request.user, user_secondary=user, pending=user.profile.private)
                else:
                    follow = follow[0]
                return Response({"following": not follow.pending, "requested": follow.pending, "followback": False})
        return Response(status=404)


class UnFollow(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        if 'user' in request.data:
            user = User.objects.filter(username=request.data['user']).all()[:1]
            if len(user) > 0:
                user = user[0]
                follow = Follow.objects.filter(
                    user=request.user, user_secondary=user).all()[:1]
                for f in follow:
                    f.delete()
                return Response({"following": False, "requested": False, "followback": len(Follow.objects.filter(
                    user_secondary=user, user=request.user, pending=False).all()) != 0})
        return Response(status=404)


class AcceptFollow(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        if 'user' in request.data:
            user = User.objects.filter(username=request.data['user']).all()[:1]
            if len(user) > 0:
                user = user[0]

                follow = Follow.objects.filter(
                    user_secondary=request.user, user=user).all()[:1]
                if len(follow) > 0:
                    follow = follow[0]
                    follow.pending = False
                    follow.save()
                    return Response({"following": len(Follow.objects.filter(
                        user_secondary=user, user=request.user, pending=False).all()) > 0, "accept": False, "followback": len(Follow.objects.filter(
                            user_secondary=user, user=request.user, pending=False).all()) == 0, "requested": len(Follow.objects.filter(
                                user=request.user, user_secondary=user, pending=True).all()) > 0})
        return Response(status=404)


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
                results.append(user.profile.get_profile(request.user))
        return Response({"users": results})


class ConnectServer(APIView):
    def post(self, request, token=None,  *args, **kwargs):
        if 'HTTP_TOKEN' in request.META.keys():
            token = request.META['HTTP_TOKEN']
            user = User.objects.filter(activity__token=token).all()
            user = user[0] if len(user) > 0 else None
            if user:
                user.activity.connected = True
                user.activity.datetime = timezone.now()
                user.save()
                users = [user.user_secondary for user in Follow.objects.filter(
                    user=user, pending=False).all()]
                requests.post("http://localhost:8080/", json={"user": [u.username for u in users],
                                                              "data": {"type": "status", "value": True, "user": user.username}})
                return Response({"user": user.username})

        return Response(status=403)


class DisconnectServer(APIView):
    def post(self, request, token=None,  *args, **kwargs):
        if 'HTTP_TOKEN' in request.META.keys():
            token = request.META['HTTP_TOKEN']
            user = User.objects.filter(activity__token=token).all()
            user = user[0] if len(user) > 0 else None
            if user:
                user.activity.connected = False
                user.activity.datetime = timezone.now()
                user.save()
                users = [user.user_secondary for user in Follow.objects.filter(
                    user=user, pending=False).all()]
                requests.post("http://localhost:8080/", json={"user": [u.username for u in users],
                                                              "data": {"type": "status", "value": False, "user": user.username}})
                return Response({"user": user.username})

        return Response(status=403)


class ServerToken(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def post(self, request,  *args, **kwargs):
        return Response({'token': request.user.activity.token})


class Profile(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = (IsAuthenticated,)

    def get(self, request, username=None, *args, **kwargs):
        user = User.objects.filter(username=username).all()
        if len(user) != 0:
            profile = user[0].profile.get_profile(request.user, True)
            trophies = {'trophy': list(
                Trophy.objects.filter(user=user[0]).all())}
            profile.update(trophies)
            return Response(profile)
        else:
            return Response(status=404)

    def put(self, request, *args, **kwargs):
        if 'first_name' in request.data.keys():
            request.user.first_name = request.data['first_name']
        if 'last_name' in request.data.keys():
            request.user.last_name = request.data['last_name']
        if 'bio' in request.data.keys():
            request.user.profile.bio = request.data['bio']
        if 'private' in request.data.keys():
            request.user.profile.private = request.data['private']
        if 'lastseen' in request.data.keys():
            request.user.profile.lastseen = request.data['lastseen']
        if 'rating' in request.data.keys():
            request.user.profile.ratingView = request.data['rating']
        if 'privateComments' in request.data.keys():
            request.user.profile.privateComments = request.data['privateComments']
        if 'imagePrimary' in request.data.keys():
            request.user.profile.image = request.data['imagePrimary']
        if 'imageSecondary' in request.data.keys():
            request.user.profile.imageSecondary = request.data['imageSecondary']

        request.user.save()
        return Response({"user": request.user.profile.get_profile(request.user)})


class VerifyLogin(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if "user" in request.data.keys():
            if request.data['user'] == request.user.username:
                return Response({"user": request.user.profile.get_profile(request.user)})
        return Response(status=403)


class Otp(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        otp = random.randint(111111, 999999)
        UserOtp.objects.update_or_create(
            user=request.user, defaults={"otp": otp})
        resp = requests.get(url="https://www.pay2all.in/web-api/send_sms?api_token=mFnxVZLjFiKjuCtrs3snaR7vMR70OHyzgc3CL2B13yivAztxgEDOENL7YzfC&senderid=OPMRVI&number=9991860504&message=" +
                            str(otp)+" is your OTP to reset your Password, valid for 5 minutes.&route=4")
        return Response(200)


class GetLoginHistory(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        history = LoginHistory.objects.filter(user=request.user).all()
        loginHistory = []
        for h in history:
            loginHistory.append(h.getHistory(request.auth.key))
        return Response({"history": loginHistory})


class Logout(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            LoginHistory.objects.update_or_create(user=request.user, token=request.auth.key, defaults={
                "logoutTime": timezone.now(), "loggedIn": False})
            request.user.activity.connected = False
            request.user.profile.fcm = None
            request.user.auth_token.delete()
            request.user.save()
        except:
            pass
        return Response(status=200)


class GetFollowDetails(APIView):
    authentication_classes = [TokenAuthentication, BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user, rtype, *args, **kwargs):
        if user:
            try:
                user = User.objects.get(username=user)
                follower = Follow.objects.filter(user_secondary=user).all()
                following_ = Follow.objects.filter(user=user).all()
                followings = len(following_)
                friends = []
                fans = []
                for (f, k) in zip(follower, following_):
                    if f.user_secondary == k.user:
                        friends.append(
                            f.user.profile.get_profile(request.user))
                    else:
                        fans.append(f.user.profile.get_profile(request.user))
                if rtype == "following":
                    following = [user.user_secondary.profile.get_profile(
                        request.user) for user in following_]
                    return Response({"data": following})
                elif rtype == "friends":
                    return Response({"data": friends})
                elif rtype == "fans":
                    diff = len(follower) - len(following_)
                    diff = diff if diff > 0 else 0
                    if diff > 0:
                        for i in range(diff-1, len(follower)):
                            fans.append(
                                follower[i].user.profile.get_profile(request.user))
                    return Response({"data": fans})
            except:
                return Response(status=404)
        return Response(status=403)
