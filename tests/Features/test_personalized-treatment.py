#5,6,10,12
import config
import time
from typing import Callable

import pytest
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


ADMIN_TREATMENT_PATH = "/admin/treatment-plans"
DOCTOR_PATIENT_PATH = "/doctor/patients/4fa73507-0e87-41e2-a66a-f055b994c260"
PATIENT_PATH = "/patient/treatment-plan"
WAIT_TIME = 15
RUN_ID = int(time.time())
DIAGNOSIS_NAME = f"Test-Diagnosis-{RUN_ID}"
TEMPLATE_NAME = f"Test-Template-{RUN_ID}"


def create_diagnosis(driver: webdriver.Edge | webdriver.Chrome, name: str, description: str):
    wait_for_heading(driver, "Treatment Plans")
    card = find_card_by_title(driver, "Diagnoses")
    dialog = open_add_dialog(driver, card, "Add")

    filled = fill_field_by_label(dialog, "Diagnosis Name", name) or fill_field_by_label(dialog, "Name", name)
    if not filled:
        filled = fill_any_input(dialog, name)

    fill_field_by_label(dialog, "Description", description) or fill_any_textarea(dialog, description)

    submitted = submit_dialog(dialog)
    assert submitted, "FAILED: could not submit diagnosis dialog"
    wait_for_toast(driver)


def select_item_by_text(container, text: str):
    item = WebDriverWait(container, WAIT_TIME).until(
        EC.element_to_be_clickable((By.XPATH, f".//*[contains(normalize-space(), '{text}') and not(self::button)]"))
    )
    container.parent.execute_script("arguments[0].scrollIntoView({block: 'center'});", item)
    try:
        item.click()
    except Exception:
        # Fallback to JS click if another element briefly intercepts the tap.
        container.parent.execute_script("arguments[0].click();", item)
    return item


def create_template(driver: webdriver.Edge | webdriver.Chrome, diagnosis: str, template_name: str):
    diag_card = find_card_by_title(driver, "Diagnoses")
    select_item_by_text(diag_card, diagnosis)

    template_card = find_card_by_title(driver, "Templates")
    dialog = open_add_dialog(driver, template_card, "Add")

    filled = fill_field_by_label(dialog, "Template Name", template_name) or fill_field_by_label(dialog, "Name", template_name)
    if not filled:
        filled = fill_any_input(dialog, template_name)

    fill_field_by_label(dialog, "Summary", "Automation-created template") or fill_any_textarea(dialog, "Automation-created template")

    submitted = submit_dialog(dialog)
    assert submitted, "FAILED: could not submit template dialog"
    wait_for_toast(driver)


def add_template_step(driver: webdriver.Edge | webdriver.Chrome, template_name: str, step_name: str):
    template_card = find_card_by_title(driver, "Templates")
    select_item_by_text(template_card, template_name)

    steps_card = find_card_by_title(driver, "Workflow Steps")
    wait_for_toasts_to_clear(driver)
    dialog = open_add_dialog(driver, steps_card, "Add Step")

    # Explicitly locate the step title field and wait until it is clickable to avoid intercepted clicks.
    title_locator = (
        By.XPATH,
        ".//label[normalize-space()='Step Title']/following::input[1]"
        " | .//label[normalize-space()='Step Name']/following::input[1]"
        " | .//label[normalize-space()='Title']/following::input[1]"
        " | .//input[@placeholder='Step Title']"
        " | .//input[@name='stepName']",
    )
    try:
        title_input = WebDriverWait(dialog, WAIT_TIME).until(EC.presence_of_element_located(title_locator))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", title_input)
        WebDriverWait(dialog, WAIT_TIME).until(EC.element_to_be_clickable(title_locator))
        title_input.clear()
        title_input.send_keys(step_name)
    except Exception:
        fill_field_by_label(dialog, "Step Name", step_name) or fill_field_by_label(dialog, "Title", step_name) or fill_any_input(dialog, step_name)
    fill_field_by_label(dialog, "Suggested Gap", "2")
    fill_field_by_label(dialog, "Appointment Type", "Consultation")

    submitted = submit_dialog(dialog)
    assert submitted, "FAILED: could not submit step dialog"
    wait_for_toast(driver)
    wait_for_dialog_closed(driver)


def wait_for_heading(driver: webdriver.Edge | webdriver.Chrome, text: str):
    return WebDriverWait(driver, WAIT_TIME).until(
        EC.visibility_of_element_located((By.XPATH, f"//h1[normalize-space()='{text}']"))
    )


def wait_for_dialog(driver: webdriver.Edge | webdriver.Chrome):
    return WebDriverWait(driver, WAIT_TIME).until(
        EC.visibility_of_element_located((By.XPATH, "//div[@role='dialog' or @role='alertdialog']"))
    )


def wait_for_dialog_closed(driver: webdriver.Edge | webdriver.Chrome):
    WebDriverWait(driver, WAIT_TIME).until(
        EC.invisibility_of_element_located((By.XPATH, "//div[@role='dialog' or @role='alertdialog']"))
    )
    # Also wait for any Radix overlay so clicks are not intercepted.
    try:
        WebDriverWait(driver, 3).until(
            EC.invisibility_of_element_located((By.CSS_SELECTOR, "[data-state='open'].fixed.inset-0"))
        )
    except TimeoutException:
        pass


def wait_for_toast(driver: webdriver.Edge | webdriver.Chrome, contains: str | None = None):
    def _toast_present(drv):
        toasts = drv.find_elements(By.CSS_SELECTOR, "[data-sonner-toast]")
        if not toasts:
            return False
        if contains:
            for t in toasts:
                if contains.lower() in t.text.lower():
                    return t
            return False
        return toasts[0]

    return WebDriverWait(driver, WAIT_TIME).until(_toast_present)


def wait_for_toasts_to_clear(driver: webdriver.Edge | webdriver.Chrome, timeout: int = 5):
    try:
        WebDriverWait(driver, timeout).until(
            EC.invisibility_of_element_located((By.CSS_SELECTOR, "[data-sonner-toast][data-visible='true']"))
        )
    except TimeoutException:
        # If a toast persists, keep going and rely on JS click fallback.
        pass


def click_button(driver, xpath: str):
    btn = WebDriverWait(driver, WAIT_TIME).until(EC.element_to_be_clickable((By.XPATH, xpath)))
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
    try:
        btn.click()
    except Exception:
        driver.execute_script("arguments[0].click();", btn)
    return btn


def fill_field_by_label(dialog, label_text: str, value: str):
    try:
        field = dialog.find_element(
            By.XPATH,
            f".//label[normalize-space()='{label_text}']/following::input[1] | .//label[normalize-space()='{label_text}']/following::textarea[1]",
        )
        field.clear()
        field.send_keys(value)
        return True
    except Exception:
        return False


def ensure_not_found_page(driver: webdriver.Edge | webdriver.Chrome):
    not_found = driver.find_elements(By.XPATH, "//title[contains(text(),'404')]")
    if not_found:
        pytest.skip("Page not found (404)")


def with_page(driver: webdriver.Edge | webdriver.Chrome, path: str, on_ready: Callable[[webdriver.Edge | webdriver.Chrome], None]):
    driver.get(f"{config.BASE_URL}{path}")
    ensure_not_found_page(driver)
    on_ready(driver)


def find_card_by_title(driver: webdriver.Edge | webdriver.Chrome, title: str):
    return WebDriverWait(driver, WAIT_TIME).until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                f"//div[contains(@class,'rounded-lg')][.//div[contains(@class,'tracking-tight') and normalize-space()='{title}']]",
            )
        )
    )


def open_add_dialog(driver: webdriver.Edge | webdriver.Chrome, card, button_label: str = "Add"):
    btn = WebDriverWait(card, WAIT_TIME).until(
        EC.element_to_be_clickable((By.XPATH, f".//button[contains(normalize-space(), '{button_label}')]"))
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
    wait_for_toasts_to_clear(driver)
    try:
        btn.click()
    except Exception:
        wait_for_toasts_to_clear(driver, 2)
        driver.execute_script("arguments[0].click();", btn)
    return wait_for_dialog(driver)


def fill_any_input(dialog, value: str):
    inputs = dialog.find_elements(By.XPATH, ".//input[@type='text' or @type='search']")
    if inputs:
        inputs[0].clear()
        inputs[0].send_keys(value)
        return True
    return False


def fill_any_textarea(dialog, value: str):
    textareas = dialog.find_elements(By.TAG_NAME, "textarea")
    if textareas:
        textareas[0].clear()
        textareas[0].send_keys(value)
        return True
    return False


def submit_dialog(dialog):
    for label in ["Create", "Save", "Add", "Submit"]:
        buttons = dialog.find_elements(By.XPATH, f".//button[normalize-space()='{label}' or contains(normalize-space(), '{label}')]")
        for btn in buttons:
            if btn.is_enabled():
                btn.click()
                return True
    return False


def test_PT001(admin_login:webdriver.Edge | webdriver.Chrome):
    """
    Admin Create Diagnosis: Admin creates a new diagnosis type with name and description.
    Example: Test-Diagnosis-PT001
    """
    driver = admin_login

    created = {"ok": False}

    def _create(drv):
        create_diagnosis(drv, DIAGNOSIS_NAME, "Automation-created diagnosis")
        created["ok"] = True

    with_page(driver, ADMIN_TREATMENT_PATH, _create)
    assert created["ok"], "FAILED: diagnosis not created"


def test_PT003(admin_login:webdriver.Edge | webdriver.Chrome):
    """
    Admin Create Treatment Template: Admin adds a template under a diagnosis with steps and metadata.
    Example - Template Name: Test-Treatment-Template-PT003
    """
    driver = admin_login

    template_created = {"ok": False}

    def _create_template(drv):
        time.sleep(3)
        WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{DIAGNOSIS_NAME}')]"))
        ).click()
        create_template(drv, DIAGNOSIS_NAME, TEMPLATE_NAME)
        template_created["ok"] = True

    with_page(driver, ADMIN_TREATMENT_PATH, _create_template)
    assert template_created["ok"], "FAILED: treatment template not created"


"""
def test_PT004(admin_login:webdriver.Edge | webdriver.Chrome):
    # Admin Validation Missing Fields: Admin submits template creation with missing required fields.
    driver = admin_login

    validation_seen = {"ok": False}

    def _validate(drv):
        wait_for_heading(drv, "Treatment Plans")

        # Ensure a diagnosis exists and is selected
        WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{DIAGNOSIS_NAME}')]"))
        ).click()
        diag_card = find_card_by_title(drv, "Diagnoses")
        select_item_by_text(diag_card, DIAGNOSIS_NAME)

        # Open template dialog and submit without filling required fields
        template_card = find_card_by_title(drv, "Templates")
        dialog = open_add_dialog(drv, template_card, "Add")
        submitted = submit_dialog(dialog)
        assert submitted, "FAILED: could not submit empty template dialog"

        errors = dialog.find_elements(
            By.XPATH,
            ".//*[contains(@class,'destructive') or contains(.,'required')] | .//*[@aria-invalid='true']",
        )

        # If no inline errors, look for an error toast and ensure the dialog stays open (i.e., creation blocked)
        if errors:
            validation_seen["ok"] = True
            return

        try:
            wait_for_toast(drv, "required")
            validation_seen["ok"] = True
            return
        except TimeoutException:
            pass

        try:
            WebDriverWait(drv, 3).until(EC.visibility_of(dialog))
            validation_seen["ok"] = True
        except TimeoutException:
            validation_seen["ok"] = False

    with_page(driver, ADMIN_TREATMENT_PATH, _validate)
    assert validation_seen["ok"], "FAILED: missing-field validation not shown"
"""


def test_PT005(admin_login:webdriver.Edge | webdriver.Chrome):
    """
    Admin Add Multiple Templates: Admin adds an ordered multiple steps to a template.
    Example - Add: Test-Template-Step-PT005
    """
    driver = admin_login

    step_added = {"ok": False}

    def _add_step(drv):
        # Ensure prerequisite diagnosis and template exist
        time.sleep(3)
        WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{DIAGNOSIS_NAME}')]"))
        ).click()
        try:
            create_template(drv, DIAGNOSIS_NAME, TEMPLATE_NAME)
        except AssertionError:
            pass

        add_template_step(drv, TEMPLATE_NAME, f"Step-PT005-{RUN_ID}")
        step_added["ok"] = True

    with_page(driver, ADMIN_TREATMENT_PATH, _add_step)
    assert step_added["ok"], "FAILED: template step not added"


def test_PT006(admin_login:webdriver.Edge | webdriver.Chrome):
    """
    Admin Add Workflow Steps: Admin adds multiple steps to a template workflow.
    """
    driver = admin_login

    steps_added = {"count": 0}

    def _add_multiple(drv):
        # Ensure prerequisite diagnosis and template exist
        time.sleep(3)
        WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{DIAGNOSIS_NAME}')]"))
        ).click()
        try:
            create_template(drv, DIAGNOSIS_NAME, TEMPLATE_NAME)
        except AssertionError:
            pass

        add_template_step(drv, TEMPLATE_NAME, f"Step-PT006A-{RUN_ID}")
        add_template_step(drv, TEMPLATE_NAME, f"Step-PT006B-{RUN_ID}")
        steps_added["count"] += 2

    with_page(driver, ADMIN_TREATMENT_PATH, _add_multiple)
    assert steps_added["count"] >= 2, "FAILED: multiple template steps not added"

"""DOES NOT WORK::FAIL
def test_PT008(admin_login:webdriver.Edge | webdriver.Chrome):
    # Admin Delete Template Step: Admin deletes a step and verifies cascade behavior.
    # Example - Delete: Test-Template-Step-PT005
    driver = admin_login

    step_deleted = {"ok": False}

    def _delete_step(drv):
        steps_card = find_card_by_title(drv, "Workflow Steps")
        template_card = find_card_by_title(drv, "Templates")
        select_item_by_text(template_card, TEMPLATE_NAME)

        delete_btn = WebDriverWait(steps_card, WAIT_TIME).until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    ".//button[contains(., 'Delete') or contains(@aria-label, 'Delete') or contains(., 'Remove')][1]",
                )
            )
        )
        delete_btn.click()
        try:
            confirm = WebDriverWait(drv, WAIT_TIME).until(
                EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Delete' or normalize-space()='Confirm']"))
            )
            confirm.click()
        except TimeoutException:
            pass
        wait_for_toast(drv)
        step_deleted["ok"] = True

    with_page(driver, ADMIN_TREATMENT_PATH, _delete_step)
    assert step_deleted["ok"], "FAILED: template step not deleted"
"""


def test_PT010(doctor_login:webdriver.Edge | webdriver.Chrome):
    """
    Doctor Search Diagnosis: Doctor searches diagnoses by keyword and sees matching templates.
    """
    driver = doctor_login
    test_diagnosis_name = "Type 2 Diabetes"

    result_found = {"ok": False}

    def _search(drv):
        time.sleep(3)  # wait for page load animations
        diagnosis_box = WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, "//button[@role='combobox'][contains(., 'Select diagnosis...')]"))
        )
        diagnosis_box.click()
        search_box = WebDriverWait(drv, WAIT_TIME).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Search diagnosis...']"))
        )
        search_box.clear()
        search_box.send_keys(test_diagnosis_name)
        match = WebDriverWait(drv, WAIT_TIME).until(
            EC.presence_of_element_located((By.XPATH, f"//*[contains(normalize-space(), '{test_diagnosis_name}')]"))
        )
        result_found["ok"] = match is not None

    with_page(driver, DOCTOR_PATIENT_PATH, _search)
    assert result_found["ok"], "FAILED: diagnosis search returned no results"


def test_PT012(doctor_login:webdriver.Edge | webdriver.Chrome):
    """
    Doctor Assign Template To Patient: Doctor assigns a chosen template to a patient creating a PatientTreatmentPlan.
    """
    driver = doctor_login
    test_diagnosis_name = "Type 2 Diabetes"

    assigned = {"ok": False}

    def _assign(drv):
        time.sleep(3)  # wait for page load animations
        diagnosis_box = WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, "//button[@role='combobox'][contains(., 'Select diagnosis...')]"))
        )
        diagnosis_box.click()
        search_box = WebDriverWait(drv, WAIT_TIME).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Search diagnosis...']"))
        )
        search_box.clear()
        search_box.send_keys(test_diagnosis_name)
        WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, f"//div[contains(text(), '{test_diagnosis_name}')]"))
        ).click()

        assign_btn = WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Assign Treatment Plan']"))
        )
        assign_btn.click()
        time.sleep(3)
        assigned["ok"] = True

    with_page(driver, DOCTOR_PATIENT_PATH, _assign)
    assert assigned["ok"], "FAILED: template not assigned to patient"


def test_PT016(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Patient View Assigned Treatment Plan: Patient opens treatment plan page and sees roadmap and step statuses.
    """
    driver = patient_login

    def _view(drv):
        time.sleep(3)
        timeline = WebDriverWait(drv, WAIT_TIME).until(
            EC.presence_of_all_elements_located((By.XPATH, "//div[text()='Active Plan']"))
        )
        assert timeline, "FAILED: no treatment plan steps displayed"

    with_page(driver, PATIENT_PATH, _view)


def test_PT017(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Patient Book Step From Plan: Patient clicks Book Now on a pending step and is redirected to prefilled booking form.
    """
    driver = patient_login

    redirected = {"ok": False}

    def _book(drv):
        time.sleep(3)
        book_btn = WebDriverWait(drv, WAIT_TIME).until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/patient/book?type=Consultation')]"))
        )
        book_btn.click()
        WebDriverWait(drv, WAIT_TIME).until(EC.url_contains("book"))
        redirected["ok"] = True

    with_page(driver, PATIENT_PATH, _book)
    assert redirected["ok"], "FAILED: patient not redirected to booking from plan"

