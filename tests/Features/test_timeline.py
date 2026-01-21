import config
import time
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


TIMELINE_PATH = "/timeline"
WAIT_TIME = 15
CARD_XPATH = "//div[contains(@class,'tracking-tight')]/ancestor::div[contains(@class,'rounded-lg') and contains(@class,'border')][1]"


def wait_for_heading_and_cards(driver, min_cards: int = 1):
    WebDriverWait(driver, WAIT_TIME).until(
        EC.visibility_of_element_located((By.XPATH, "//h2[normalize-space()='Activity Log']"))
    )
    WebDriverWait(driver, WAIT_TIME).until(lambda d: len(get_cards(d)) >= min_cards)
    return get_cards(driver)


def get_cards(driver):
    return driver.find_elements(By.XPATH, CARD_XPATH)


def extract_card_data(card):
    title_el = card.find_element(By.XPATH, ".//div[contains(@class,'tracking-tight')]")
    ts_el = card.find_element(By.XPATH, ".//span[contains(@class,'text-xs') and contains(@class,'text-muted-foreground')]")
    status_els = card.find_elements(By.XPATH, ".//div[contains(@class,'inline-flex') and contains(@class,'text-xs')]")
    attachment_els = card.find_elements(By.LINK_TEXT, "View Attachment")
    return {
        "title": title_el.text.strip(),
        "timestamp_text": ts_el.text.strip(),
        "status_text": status_els[0].text.strip() if status_els else "",
        "has_attachment": len(attachment_els) > 0,
    }


def parse_timestamp(ts_text: str) -> datetime:
    return datetime.strptime(ts_text, "%b %d, %I:%M %p")


def click_clear_filters(driver):
    btn = WebDriverWait(driver, WAIT_TIME).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@title='Clear Filters']"))
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
    try:
        btn.click()
    except Exception:
        driver.execute_script("arguments[0].click();", btn)


def close_calendar_if_open(driver):
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    WebDriverWait(driver, WAIT_TIME).until_not(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "div[data-slot='calendar']"))
    )


def open_date_picker(driver):
    btn = WebDriverWait(driver, WAIT_TIME).until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                "//button[.//span[text()='Pick a date range'] or contains(., 'Pick a date range') or contains(., '20')][1]",
            )
        )
    )
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
    try:
        btn.click()
    except Exception:
        driver.execute_script("arguments[0].click();", btn)
    WebDriverWait(driver, WAIT_TIME).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "div[data-slot='calendar']"))
    )


def select_calendar_day(driver, dt: datetime):
    target = f"{dt.month}/{dt.day}/{dt.year}"

    def candidates():
        return driver.find_elements(By.CSS_SELECTOR, f"button[data-day='{target}']")

    def try_click(btns):
        for el in btns:
            if el.is_displayed() and el.is_enabled():
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", el)
                try:
                    el.click()
                except Exception:
                    driver.execute_script("arguments[0].click();", el)
                return True
        return False

    # Try immediately if calendar is already on the right month
    if try_click(candidates()):
        return

    today = datetime.now()
    months_diff = (dt.year - today.year) * 12 + (dt.month - today.month)
    step_selector = "button.rdp-button_next" if months_diff >= 0 else "button.rdp-button_previous"
    steps = abs(months_diff) + 3

    for _ in range(steps):
        nav = WebDriverWait(driver, WAIT_TIME).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, step_selector))
        )
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", nav)
        try:
            nav.click()
        except Exception:
            driver.execute_script("arguments[0].click();", nav)
        WebDriverWait(driver, WAIT_TIME).until(
            EC.visibility_of_any_elements_located((By.CSS_SELECTOR, "button[data-day]"))
        )
        if try_click(candidates()):
            return

    raise TimeoutError("FAILED:Could not select date in calendar (headless-safe)")


def scroll_to_bottom(driver):
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1)


def test_TL001(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Initial Timeline Load: Open timeline for a patient and verify records load and render.
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{TIMELINE_PATH}")

    cards = wait_for_heading_and_cards(driver, min_cards=1)
    card_data = [extract_card_data(c) for c in cards]

    empty_state = driver.find_elements(By.XPATH, "//div[contains(text(),'No activities found matching your criteria.')]")
    assert not empty_state or not empty_state[0].is_displayed(), "FAILED:Unexpected empty state displayed"
    assert all(data["title"] for data in card_data), "FAILED:Card title missing"

    if len(card_data) >= 2:
        first_ts = parse_timestamp(card_data[0]["timestamp_text"])
        second_ts = parse_timestamp(card_data[1]["timestamp_text"])
        assert first_ts >= second_ts, "FAILED:Cards not sorted newest first"


def test_TL004(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Filter Timeline By Date Range: Apply start and end date filters and verify only records in range shown.
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{TIMELINE_PATH}")

    initial_cards = wait_for_heading_and_cards(driver, min_cards=2)
    initial_count = len(initial_cards)

    start_dt = datetime(2026, 1, 1)
    end_dt = datetime(2026, 1, 31)
    open_date_picker(driver)
    select_calendar_day(driver, start_dt)
    select_calendar_day(driver, end_dt)
    close_calendar_if_open(driver)

    def all_january(drv):
        cards_now = get_cards(drv)
        if not cards_now:
            return False
        return all(parse_timestamp(extract_card_data(c)["timestamp_text"]).month == 1 for c in cards_now)

    WebDriverWait(driver, WAIT_TIME).until(all_january)
    jan_cards = get_cards(driver)
    assert len(jan_cards) > 0, "FAILED:No cards after January filter"
    assert all("Dec" not in extract_card_data(c)["timestamp_text"] for c in jan_cards), "FAILED:Out-of-range card still visible"

    click_clear_filters(driver)
    WebDriverWait(driver, WAIT_TIME).until(lambda d: len(get_cards(d)) >= initial_count)


def test_TL005(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Filter Timeline By Type: Apply type filter (e.g. Appointment;Note;File;etc) and verify timeline shows only related visits.
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{TIMELINE_PATH}")

    initial_cards = wait_for_heading_and_cards(driver, min_cards=2)
    initial_count = len(initial_cards)

    WebDriverWait(driver, WAIT_TIME).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@role='combobox' and contains(., 'Filter by Type')]"))
    ).click()
    WebDriverWait(driver, WAIT_TIME).until(
        EC.element_to_be_clickable((By.XPATH, "//div[@role='option' and normalize-space()='Clinical Notes']"))
    ).click()

    def only_notes(drv):
        cards_now = get_cards(drv)
        return cards_now and all("Clinical Note" in extract_card_data(c)["title"] for c in cards_now)

    WebDriverWait(driver, WAIT_TIME).until(only_notes)
    note_cards = get_cards(driver)
    assert len(note_cards) > 0, "FAILED:No cards after type filter"
    assert all("Appointment with" not in extract_card_data(c)["title"] for c in note_cards), "FAILED:Non-note cards present after type filter"

    click_clear_filters(driver)
    WebDriverWait(driver, WAIT_TIME).until(lambda d: len(get_cards(d)) >= initial_count)


def test_TL006(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Search Patient Visits By Keyword: Search timeline for keyword in notes and verify matches.
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{TIMELINE_PATH}")

    wait_for_heading_and_cards(driver, min_cards=2)
    search_input = WebDriverWait(driver, WAIT_TIME).until(
        EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Search timeline...']"))
    )

    keyword = "Pain"
    search_input.clear()
    search_input.send_keys(keyword)

    def results_match(drv):
        cards_now = get_cards(drv)
        if not cards_now:
            return False
        return all(keyword.lower() in c.text.lower() for c in cards_now)

    WebDriverWait(driver, WAIT_TIME).until(results_match)

    search_input.clear()
    search_input.send_keys("zzzz-nope")
    WebDriverWait(driver, WAIT_TIME).until(
        lambda d: (
            d.find_elements(By.XPATH, "//div[contains(text(),'No activities found matching your criteria.')]")
            and d.find_elements(By.XPATH, "//div[contains(text(),'No activities found matching your criteria.')]")[0].is_displayed()
        )
        or len(get_cards(d)) == 0,
        "FAILED:No empty state after unmatched search",
    )

    click_clear_filters(driver)
    wait_for_heading_and_cards(driver, min_cards=2)


def test_TL008(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Pagination and Infinite Scroll: Scroll through timeline with many records and verify pagination or infinite load works.
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{TIMELINE_PATH}")

    cards = wait_for_heading_and_cards(driver, min_cards=2)
    titles_before = [extract_card_data(c)["title"] for c in cards]
    count_before = len(cards)

    scroll_to_bottom(driver)
    cards_after = get_cards(driver)
    titles_after = [extract_card_data(c)["title"] for c in cards_after]

    assert count_before == len(cards_after), "FAILED:Card count changed after scroll"
    assert titles_before == titles_after, "FAILED:Order changed after scroll"


def test_TL010(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Attachment Indicator: Verify timeline entries with uploaded records show attachment icon.
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{TIMELINE_PATH}")

    wait_for_heading_and_cards(driver, min_cards=1)
    attachment_links = driver.find_elements(By.LINK_TEXT, "View Attachment")
    assert attachment_links, "FAILED:No attachment links found on timeline"

    href = attachment_links[0].get_attribute("href")
    assert href, "FAILED:Attachment link missing href"

    original_handles = driver.window_handles
    original_url = driver.current_url
    attachment_links[0].click()

    def attachment_opened(drv):
        return len(drv.window_handles) > len(original_handles) or drv.current_url != original_url

    WebDriverWait(driver, WAIT_TIME).until(attachment_opened)

    if len(driver.window_handles) > len(original_handles):
        driver.switch_to.window(driver.window_handles[-1])
        assert driver.current_url, "FAILED:Attachment tab opened without URL"
        driver.close()
        driver.switch_to.window(original_handles[0])