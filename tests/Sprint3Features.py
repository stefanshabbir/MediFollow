import random
import time

from login import get_login
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class DoctorNotesFeature:
    def __init__(self, name:str):
        self.name = name
        self.driver = get_login("hinoseb173@alexida.com", "123456789")
        self.driver.get("https://medi-follow.vercel.app/doctor/patients/4fa73507-0e87-41e2-a66a-f055b994c260")

    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.driver.quit()
        print(f"\nFinished testing {self.name}")
        print("="*10)
        return False
    
    def test_dn001(self):
        """
        Open Notes Load Existing Draft: Open consultation notes for a patient and verify existing draft loads.
        """
        test_text = "test_dn001: Placing dummy draft text. " + str(random.randint(1000, 9999))
        notes_field = WebDriverWait(self.driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'textarea[placeholder*="Type clinical observations, diagnosis, and treatment plan..."]')) 
        )
        print("Clearing existing draft and placing new draft text...")
        notes_field.clear()
        notes_field.send_keys(test_text)
        time.sleep(5)  # Wait for autosave to occur
        self.driver.get("https://medi-follow.vercel.app/doctor/patients")
        self.driver.get("https://medi-follow.vercel.app/doctor/patients/4fa73507-0e87-41e2-a66a-f055b994c260")
        self.driver.refresh()
        print("Reopened patient consultation to verify draft persistence...")
        draft_text = self.driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder*="Type clinical observations, diagnosis, and treatment plan..."]').get_attribute("value")
        assert draft_text == test_text, f"FAILED: Draft text did not persist. Expected: {test_text}, Found: {draft_text}"
        print("test_dn001 passed: Existing draft loaded successfully.")

    def test_dn002(self):
        """
        Start New Note Empty Draft: Open notes when no draft exists and verify editor state
        """
        notes_field = WebDriverWait(self.driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'textarea[placeholder*="Type clinical observations, diagnosis, and treatment plan..."]')) 
        )
        print("Opening new note to verify empty draft state...")
        assert notes_field.get_attribute("value") == "", "FAILED: Expected empty draft for new note, but found existing text."
        print("test_dn002 passed: New note opened with empty draft.")

    def test_dn003(self):
        """
        Auto Save Draft Interval: Type text and wait for autosave interval to elapse; verify draft saved.
        """
        test_text = "test_dn003: Placing dummy text to test autosave. " + str(random.randint(1000, 9999))
        notes_field = WebDriverWait(self.driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'textarea[placeholder*="Type clinical observations, diagnosis, and treatment plan..."]')) 
        )
        print("Typing text to test autosave functionality...")
        notes_field.clear()
        notes_field.send_keys(test_text)
        print("Waiting for autosave interval to elapse...")
        time.sleep(5)  # Wait for autosave interval (assuming 5 seconds)
        self.driver.refresh()
        draft_text = self.driver.find_element(By.CSS_SELECTOR, 'textarea[placeholder*="Type clinical observations, diagnosis, and treatment plan..."]').get_attribute("value")     
        print("Verifying that draft text was autosaved...")
        assert draft_text == test_text, f"FAILED: Draft text did not persist. Expected: {test_text}, Found: {draft_text}"
        print("test_dn003 passed: Auto save draft interval verified successfully.")

    def test_dn004_dn005(self):
        """
        DN-004 - Manual Save Finalize: Click Finalize Consultation and verify draft becomes final record.\n
        DN-005 - Edit After Finalize Blocked: Attempt to edit notes after finalize and verify edits are blocked.
        """
        test_text = "test_dn004_dn005: Placing dummy text to test manual save. " + str(random.randint(1000, 9999))
        notes_field = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'textarea[placeholder*="Type clinical observations, diagnosis, and treatment plan..."]')) 
        )
        print("Typing text to test manual save and finalize functionality...")
        notes_field.clear()
        notes_field.send_keys(test_text)
        print("Clicking 'Finalize Consultation' button...")
        WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Finalize Consultation']"))).click()
        WebDriverWait(self.driver, 10).until(EC.alert_is_present()).accept()     
        confirmation_text = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(normalize-space(.), 'Finalized') and .//*[local-name()='svg']]"))
        ).get_attribute("innerText")
        print("Verifying that consultation was finalized...")
        assert "Finalized" in confirmation_text, "FAILED: Consultation was not finalized properly."
        print("test_dn004 passed: Manual save and finalize verified successfully.")
        assert not notes_field.is_enabled(), "FAILED: Notes field is still editable after finalization."
        print("test_dn005 passed: Editing blocked after finalization verified successfully.")


def test_doctor_notes():
    with DoctorNotesFeature("DN-001") as dn001:
        dn001.test_dn001()
    with DoctorNotesFeature("DN-003") as dn003:
        dn003.test_dn003()
    with DoctorNotesFeature("DN-004 & DN-005") as dn004_dn005:
        dn004_dn005.test_dn004_dn005()
    with DoctorNotesFeature("DN-002") as dn002:
        dn002.test_dn002()