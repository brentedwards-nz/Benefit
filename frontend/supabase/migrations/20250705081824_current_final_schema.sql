create type "public"."Contact Type" as enum ('Email', 'Phone', 'Address');

create type "public"."Role" as enum ('SystemAdmin', 'Owner', 'Admin', 'Coordinator', 'Instructor', 'ProfileOnly');

create table "public"."club" (
    "club_id" uuid not null default gen_random_uuid(),
    "club_name" text not null,
    "club_address" text,
    "club_phone" text,
    "current" boolean not null default false,
    "disabled" boolean not null default true,
    "created_at" timestamp without time zone default now()
);


create table "public"."contact" (
    "contact_id" uuid not null default gen_random_uuid(),
    "auth_id" uuid not null,
    "contact_type_id" uuid not null,
    "contact_value" text not null,
    "is_primary" boolean default false,
    "current" boolean not null default false,
    "disabled" boolean not null default true,
    "created_at" timestamp without time zone default now(),
    "type" "Contact Type" default 'Phone'::"Contact Type"
);


create table "public"."profiles" (
    "auth_id" uuid not null,
    "first_name" text,
    "last_name" text,
    "birth_date" date,
    "current" boolean not null default false,
    "disabled" boolean not null default true,
    "created_at" timestamp without time zone default now()
);


alter table "public"."profiles" enable row level security;

create table "public"."staff" (
    "staff_id" uuid not null default gen_random_uuid(),
    "club_id" uuid not null,
    "auth_id" uuid not null,
    "hired_at" timestamp without time zone default now(),
    "current" boolean not null default false,
    "disabled" boolean not null default true,
    "roles" jsonb default '[{"role": "Profile Only"}]'::jsonb
);


CREATE UNIQUE INDEX club_pkey ON public.club USING btree (club_id);

CREATE UNIQUE INDEX contact_details_pkey ON public.contact USING btree (contact_id);

CREATE INDEX idx_contact_profile ON public.contact USING btree (auth_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (auth_id);

CREATE UNIQUE INDEX staff_club_id_profile_id_key ON public.staff USING btree (club_id, auth_id);

CREATE UNIQUE INDEX staff_pkey ON public.staff USING btree (staff_id);

alter table "public"."club" add constraint "club_pkey" PRIMARY KEY using index "club_pkey";

alter table "public"."contact" add constraint "contact_details_pkey" PRIMARY KEY using index "contact_details_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."staff" add constraint "staff_pkey" PRIMARY KEY using index "staff_pkey";

alter table "public"."contact" add constraint "contact_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."contact" validate constraint "contact_auth_id_fkey";

alter table "public"."profiles" add constraint "profiles_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_auth_id_fkey";

alter table "public"."staff" add constraint "staff_auth_id_fkey1" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."staff" validate constraint "staff_auth_id_fkey1";

alter table "public"."staff" add constraint "staff_club_id_fkey" FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE not valid;

alter table "public"."staff" validate constraint "staff_club_id_fkey";

alter table "public"."staff" add constraint "staff_club_id_profile_id_key" UNIQUE using index "staff_club_id_profile_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  INSERT INTO public.profiles (auth_id)
  VALUES (NEW.id);
  RETURN NEW;
END;$function$
;

grant delete on table "public"."club" to "anon";

grant insert on table "public"."club" to "anon";

grant references on table "public"."club" to "anon";

grant select on table "public"."club" to "anon";

grant trigger on table "public"."club" to "anon";

grant truncate on table "public"."club" to "anon";

grant update on table "public"."club" to "anon";

grant delete on table "public"."club" to "authenticated";

grant insert on table "public"."club" to "authenticated";

grant references on table "public"."club" to "authenticated";

grant select on table "public"."club" to "authenticated";

grant trigger on table "public"."club" to "authenticated";

grant truncate on table "public"."club" to "authenticated";

grant update on table "public"."club" to "authenticated";

grant delete on table "public"."club" to "service_role";

grant insert on table "public"."club" to "service_role";

grant references on table "public"."club" to "service_role";

grant select on table "public"."club" to "service_role";

grant trigger on table "public"."club" to "service_role";

grant truncate on table "public"."club" to "service_role";

grant update on table "public"."club" to "service_role";

grant delete on table "public"."contact" to "anon";

grant insert on table "public"."contact" to "anon";

grant references on table "public"."contact" to "anon";

grant select on table "public"."contact" to "anon";

grant trigger on table "public"."contact" to "anon";

grant truncate on table "public"."contact" to "anon";

grant update on table "public"."contact" to "anon";

grant delete on table "public"."contact" to "authenticated";

grant insert on table "public"."contact" to "authenticated";

grant references on table "public"."contact" to "authenticated";

grant select on table "public"."contact" to "authenticated";

grant trigger on table "public"."contact" to "authenticated";

grant truncate on table "public"."contact" to "authenticated";

grant update on table "public"."contact" to "authenticated";

grant delete on table "public"."contact" to "service_role";

grant insert on table "public"."contact" to "service_role";

grant references on table "public"."contact" to "service_role";

grant select on table "public"."contact" to "service_role";

grant trigger on table "public"."contact" to "service_role";

grant truncate on table "public"."contact" to "service_role";

grant update on table "public"."contact" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."staff" to "anon";

grant insert on table "public"."staff" to "anon";

grant references on table "public"."staff" to "anon";

grant select on table "public"."staff" to "anon";

grant trigger on table "public"."staff" to "anon";

grant truncate on table "public"."staff" to "anon";

grant update on table "public"."staff" to "anon";

grant delete on table "public"."staff" to "authenticated";

grant insert on table "public"."staff" to "authenticated";

grant references on table "public"."staff" to "authenticated";

grant select on table "public"."staff" to "authenticated";

grant trigger on table "public"."staff" to "authenticated";

grant truncate on table "public"."staff" to "authenticated";

grant update on table "public"."staff" to "authenticated";

grant delete on table "public"."staff" to "service_role";

grant insert on table "public"."staff" to "service_role";

grant references on table "public"."staff" to "service_role";

grant select on table "public"."staff" to "service_role";

grant trigger on table "public"."staff" to "service_role";

grant truncate on table "public"."staff" to "service_role";

grant update on table "public"."staff" to "service_role";

create policy "Users can read their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = auth_id));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = auth_id));



