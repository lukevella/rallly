ALTER TABLE "instance_settings"
  ADD CONSTRAINT instance_settings_singleton CHECK (id = 1);

CREATE OR REPLACE FUNCTION prevent_delete_instance_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id = 1 THEN
    RAISE EXCEPTION 'Deleting the instance_settings record (id=1) is not permitted.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_instance_settings_deletion
BEFORE DELETE ON instance_settings
FOR EACH ROW EXECUTE FUNCTION prevent_delete_instance_settings();
