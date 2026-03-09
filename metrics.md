docker builder prune -af

time docker build \
--no-cache \
--progress=plain \
-t u745/recipes-backend:1.0.0 \
./backend

# 0.09s user 0.43s system 0% cpu 1:10.27 total

u745/recipes-backend:1.0.0   2b4fb731d4f4        255MB         63.2MB      

time docker build \
  --no-cache \
  --progress=plain \
  -t u745/recipes-frontend:1.0.0 \
  ./frontend
# 0.07s user 0.24s system 1% cpu 18.480 total

docker history u745/recipes-backend:1.0.0
IMAGE          CREATED         CREATED BY                                      SIZE      COMMENT
2b4fb731d4f4   6 minutes ago   CMD ["run.sh"]                                  0B        buildkit.dockerfile.v0
<missing>      6 minutes ago   VOLUME [/vol/web/static]                        0B        buildkit.dockerfile.v0
<missing>      6 minutes ago   VOLUME [/vol/web/media]                         0B        buildkit.dockerfile.v0
<missing>      6 minutes ago   USER django-user                                0B        buildkit.dockerfile.v0
<missing>      6 minutes ago   ENV PATH=/scripts:/py/bin:/usr/local/bin:/us…   0B        buildkit.dockerfile.v0
<missing>      6 minutes ago   RUN |2 UID=101 DEV=false /bin/sh -c python -…   131MB     buildkit.dockerfile.v0
<missing>      7 minutes ago   ARG DEV=false                                   0B        buildkit.dockerfile.v0
<missing>      7 minutes ago   EXPOSE [8000/tcp]                               0B        buildkit.dockerfile.v0
<missing>      7 minutes ago   WORKDIR /app                                    4.1kB     buildkit.dockerfile.v0
<missing>      7 minutes ago   COPY ./backend /app # buildkit                  233kB     buildkit.dockerfile.v0
<missing>      7 minutes ago   COPY ./scripts /scripts # buildkit              12.3kB    buildkit.dockerfile.v0
<missing>      7 minutes ago   COPY ./backend/requirements.dev.txt /tmp/req…   12.3kB    buildkit.dockerfile.v0
<missing>      7 minutes ago   COPY ./backend/requirements.txt /tmp/require…   12.3kB    buildkit.dockerfile.v0
<missing>      7 minutes ago   ARG UID=101                                     0B        buildkit.dockerfile.v0
<missing>      7 minutes ago   ENV PYTHONUNBUFFERED=1                          0B        buildkit.dockerfile.v0
<missing>      7 minutes ago   LABEL maintainer=londonappdeveloper.com         0B        buildkit.dockerfile.v0
<missing>      5 days ago      CMD ["python3"]                                 0B        buildkit.dockerfile.v0
<missing>      5 days ago      RUN /bin/sh -c set -eux;  for src in idle3 p…   16.4kB    buildkit.dockerfile.v0
<missing>      5 days ago      RUN /bin/sh -c set -eux;   apk add --no-cach…   48.2MB    buildkit.dockerfile.v0
<missing>      5 days ago      ENV PYTHON_SHA256=de6517421601e39a9a3bc3e1bc…   0B        buildkit.dockerfile.v0
<missing>      5 days ago      ENV PYTHON_VERSION=3.10.20                      0B        buildkit.dockerfile.v0
<missing>      5 days ago      ENV GPG_KEY=A035C8C19219BA821ECEA86B64E628F8…   0B        buildkit.dockerfile.v0
<missing>      5 days ago      RUN /bin/sh -c set -eux;  apk add --no-cache…   3.02MB    buildkit.dockerfile.v0
<missing>      5 days ago      ENV LANG=C.UTF-8                                0B        buildkit.dockerfile.v0
<missing>      5 days ago      ENV PATH=/usr/local/bin:/usr/local/sbin:/usr…   0B        buildkit.dockerfile.v0
<missing>      5 weeks ago     CMD ["/bin/sh"]                                 0B        buildkit.dockerfile.v0
<missing>      5 weeks ago     ADD alpine-minirootfs-3.22.3-x86_64.tar.gz /…   8.99MB    buildkit.dockerfile.v0