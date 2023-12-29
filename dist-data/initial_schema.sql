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

insert into MoodKind values ('1F600', 'happy',false);
insert into MoodKind values ('1F641', 'sad',false);
insert into MoodKind values ('1F62E', 'surprised',false);
insert into MoodKind values ('1F629', 'weary',false);
insert into MoodKind values ('1F971', 'tired',false);
insert into MoodKind values ('1F914', 'thinking',false);
insert into ActivityKind values ('1F3AE', 'gaming',false);
insert into ActivityKind values ('1F3CB', 'lifting',false);
insert into ActivityKind values ('1F4D6', 'reading',false);

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
