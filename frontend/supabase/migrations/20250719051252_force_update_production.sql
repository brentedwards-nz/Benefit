drop policy "Users can read their own profile" on "public"."profiles";

drop policy "Users can update their own profile" on "public"."profiles";

revoke delete on table "public"."club" from "anon";

revoke insert on table "public"."club" from "anon";

revoke references on table "public"."club" from "anon";

revoke select on table "public"."club" from "anon";

revoke trigger on table "public"."club" from "anon";

revoke truncate on table "public"."club" from "anon";

revoke update on table "public"."club" from "anon";

revoke delete on table "public"."club" from "authenticated";

revoke insert on table "public"."club" from "authenticated";

revoke references on table "public"."club" from "authenticated";

revoke select on table "public"."club" from "authenticated";

revoke trigger on table "public"."club" from "authenticated";

revoke truncate on table "public"."club" from "authenticated";

revoke update on table "public"."club" from "authenticated";

revoke delete on table "public"."club" from "service_role";

revoke insert on table "public"."club" from "service_role";

revoke references on table "public"."club" from "service_role";

revoke select on table "public"."club" from "service_role";

revoke trigger on table "public"."club" from "service_role";

revoke truncate on table "public"."club" from "service_role";

revoke update on table "public"."club" from "service_role";

revoke delete on table "public"."contact" from "anon";

revoke insert on table "public"."contact" from "anon";

revoke references on table "public"."contact" from "anon";

revoke select on table "public"."contact" from "anon";

revoke trigger on table "public"."contact" from "anon";

revoke truncate on table "public"."contact" from "anon";

revoke update on table "public"."contact" from "anon";

revoke delete on table "public"."contact" from "authenticated";

revoke insert on table "public"."contact" from "authenticated";

revoke references on table "public"."contact" from "authenticated";

revoke select on table "public"."contact" from "authenticated";

revoke trigger on table "public"."contact" from "authenticated";

revoke truncate on table "public"."contact" from "authenticated";

revoke update on table "public"."contact" from "authenticated";

revoke delete on table "public"."contact" from "service_role";

revoke insert on table "public"."contact" from "service_role";

revoke references on table "public"."contact" from "service_role";

revoke select on table "public"."contact" from "service_role";

revoke trigger on table "public"."contact" from "service_role";

revoke truncate on table "public"."contact" from "service_role";

revoke update on table "public"."contact" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."staff" from "anon";

revoke insert on table "public"."staff" from "anon";

revoke references on table "public"."staff" from "anon";

revoke select on table "public"."staff" from "anon";

revoke trigger on table "public"."staff" from "anon";

revoke truncate on table "public"."staff" from "anon";

revoke update on table "public"."staff" from "anon";

revoke delete on table "public"."staff" from "authenticated";

revoke insert on table "public"."staff" from "authenticated";

revoke references on table "public"."staff" from "authenticated";

revoke select on table "public"."staff" from "authenticated";

revoke trigger on table "public"."staff" from "authenticated";

revoke truncate on table "public"."staff" from "authenticated";

revoke update on table "public"."staff" from "authenticated";

revoke delete on table "public"."staff" from "service_role";

revoke insert on table "public"."staff" from "service_role";

revoke references on table "public"."staff" from "service_role";

revoke select on table "public"."staff" from "service_role";

revoke trigger on table "public"."staff" from "service_role";

revoke truncate on table "public"."staff" from "service_role";

revoke update on table "public"."staff" from "service_role";

alter table "public"."contact" drop constraint "contact_auth_id_fkey";

alter table "public"."profiles" drop constraint "profiles_auth_id_fkey";

alter table "public"."staff" drop constraint "staff_auth_id_fkey1";

alter table "public"."staff" drop constraint "staff_club_id_profile_id_key";

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

drop function if exists "public"."create_profile_for_new_user"();

alter table "public"."contact" drop constraint "contact_details_pkey";

drop index if exists "public"."contact_details_pkey";

drop index if exists "public"."idx_contact_profile";

drop table "public"."contact";

create table "public"."_prisma_migrations" (
    "id" character varying(36) not null,
    "checksum" character varying(64) not null,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) not null,
    "logs" text,
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone not null default now(),
    "applied_steps_count" integer not null default 0
);

alter table "public"."club" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."club" alter column "created_at" set data type timestamp(6) without time zone using "created_at"::timestamp(6) without time zone;

alter table "public"."profiles" add column "avatar_url" text;

alter table "public"."profiles" add column "contact_info" jsonb;

alter table "public"."profiles" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."profiles" alter column "created_at" set data type timestamp(6) without time zone using "created_at"::timestamp(6) without time zone;

alter table "public"."profiles" disable row level security;

alter table "public"."staff" alter column "hired_at" set default CURRENT_TIMESTAMP;

alter table "public"."staff" alter column "hired_at" set data type timestamp(6) without time zone using "hired_at"::timestamp(6) without time zone;

drop type "public"."Contact Type";

CREATE UNIQUE INDEX _prisma_migrations_pkey ON public._prisma_migrations USING btree (id);

alter table "public"."_prisma_migrations" add constraint "_prisma_migrations_pkey" PRIMARY KEY using index "_prisma_migrations_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  v_contact_info JSONB;
BEGIN
  -- Construct the contact_info JSONB object with only email
  v_contact_info := jsonb_build_object(
    'email', jsonb_build_array(
      jsonb_build_object('email', NEW.email, 'primary', TRUE)
    )
  );

  INSERT INTO public.profiles (
    auth_id,
    first_name,
    last_name,
    contact_info
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    v_contact_info -- Insert the constructed JSONB object
  );
  RETURN NEW;
END;

$function$;

-- The TRIGGER statement, now placed OUTSIDE the function definition
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();