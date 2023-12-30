create table DoingNow (
    id          integer primary key autoincrement,
    content     text,
    timestamp   integer
);

create table Thoughts (
    id          integer primary key autoincrement,
    content     text,
    timestamp   integer
);

create table MoodKind (
    code        text primary key,
    label       text,
    hidden      boolean default false
);

create table Mood (
    id          integer primary key autoincrement,
    kind        text,
    timestamp   integer,
    foreign key (kind) references MoodKind(code) on delete cascade
);

create table ActivityKind (
    code        text primary key,
    label       text,
    hidden      boolean default false
);

create table Activity (
    id          integer primary key autoincrement,
    kind        text,
    timestamp   integer,
    foreign key (kind) references ActivityKind(code) on delete cascade
);

insert into MoodKind values ('1f600', 'happy', false);
insert into MoodKind values ('1f641', 'sad', false);
insert into MoodKind values ('1f62e', 'surprised', false);
insert into MoodKind values ('1f629', 'weary', false);
insert into MoodKind values ('1f971', 'tired', false);
insert into MoodKind values ('1f914', 'thinking', false);
insert into MoodKind values ('1f92f', 'mind blown', false);
insert into ActivityKind values ('1f3ae', 'gaming', false);
insert into ActivityKind values ('1f3cb', 'lifting', false);
insert into ActivityKind values ('1f4d6', 'reading', false);
insert into ActivityKind values ('1f6cf-fe0f', 'going to bed', false);
insert into ActivityKind values ('1f6b6', 'walking', false);
insert into ActivityKind values ('2615', 'coffee', false);
insert into ActivityKind values ('1f3b6', 'listening to music', false);

create table Day (
    date        text primary key,
    content     text
);

create table DayRatingKind (
    kind        text primary key
);

create table DayRating (
    date        text,
    kind        text,
    magnitude   integer,
    primary key (date, kind),
    foreign key (date) references Day(date) on delete cascade,
    foreign key (kind) references DayRatingKind(kind) on delete cascade
);

/* Every day, these can be ignored, or they can be registered */
insert into DayRatingKind values ('Productive');
insert into DayRatingKind values ('Happy');
insert into DayRatingKind values ('Interesting');
insert into DayRatingKind values ('Difficult');
