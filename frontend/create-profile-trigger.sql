-- Create a function to automatically create a profile when a new user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new profile record for the new user
    INSERT INTO "Profile" (
        auth_id,
        first_name,
        last_name,
        current,
        disabled,
        avatar_url,
        contact_info,
        created_at
    ) VALUES (
        NEW.id,
        COALESCE(split_part(NEW.name, ' ', 1), NULL),
        CASE 
            WHEN array_length(string_to_array(NEW.name, ' '), 1) > 1 
            THEN array_to_string(string_to_array(NEW.name, ' ')[2:], ' ')
            ELSE NULL
        END,
        true,
        false,
        NEW.image,
        jsonb_build_array(
            jsonb_build_object(
                'type', 'email',
                'value', COALESCE(NEW.email, ''),
                'primary', true,
                'label', 'Primary Email'
            )
        ),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER create_profile_on_user_insert
    AFTER INSERT ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Note: You may need to run this as a superuser or with appropriate permissions
-- If you get permission errors, you can also handle this in the application layer 