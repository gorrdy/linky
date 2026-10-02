import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { renderIntoDocument } from "../testUtils/renderIntoDocument";
import { ContactsPage } from "./ContactsPage";

describe("ContactsPage", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders active proxy-payment contacts in their own section", async () => {
    const { container, root } = await renderIntoDocument(
      <ContactsPage
        activeGroup={null}
        bottomTabActive="contacts"
        contactsSearch=""
        contactsSearchInputRef={{ current: null }}
        conversationsLabel="Conversations"
        filterOpen={false}
        filterOptions={[]}
        openNewContactPage={() => undefined}
        otherContactsLabel="Other contacts"
        renderContactCard={(contact) => (
          <div key={contact.id ?? ""} data-contact-id={contact.id ?? ""}>
            {contact.name ?? ""}
          </div>
        )}
        setActiveGroup={() => undefined}
        setContactsSearch={() => undefined}
        showBottomTabBar={false}
        showFab={false}
        showGroupFilter={false}
        t={(key) => (key === "proxyPayments" ? "Proxy payments" : key)}
        visibleContacts={{
          conversations: [{ id: "contact-2", name: "Bob" }],
          others: [{ id: "contact-3", name: "Carol" }],
          pinned: [],
          proxyPayments: [{ id: "contact-1", name: "Alice" }],
        }}
      />,
    );

    expect(
      [...container.querySelectorAll('[role="heading"]')].map(
        (element) => element.textContent,
      ),
    ).toEqual(["Proxy payments", "Conversations", "Other contacts"]);
    expect(
      container.querySelectorAll('[data-contact-id="contact-1"]'),
    ).toHaveLength(1);

    await act(async () => root.unmount());
  });

  it("renders search and group filter only while the filter is open", async () => {
    const renderPage = (filterOpen: boolean) =>
      renderIntoDocument(
        <ContactsPage
          activeGroup={null}
          bottomTabActive="contacts"
          contactsSearch=""
          contactsSearchInputRef={{ current: null }}
          conversationsLabel="Conversations"
          filterOpen={filterOpen}
          filterOptions={[{ count: 1, label: "Friends", value: "friends" }]}
          openNewContactPage={() => undefined}
          otherContactsLabel="Other contacts"
          renderContactCard={(contact) => (
            <div key={contact.id ?? ""}>{contact.name ?? ""}</div>
          )}
          setActiveGroup={() => undefined}
          setContactsSearch={() => undefined}
          showBottomTabBar={false}
          showFab={false}
          showGroupFilter={true}
          t={(key) => key}
          visibleContacts={{
            conversations: [],
            others: [{ id: "contact-1", name: "Alice" }],
            pinned: [],
            proxyPayments: [],
          }}
        />,
      );

    const closed = await renderPage(false);
    expect(closed.container.querySelector("input")).toBeNull();
    expect(closed.container.querySelector('[aria-label="group"]')).toBeNull();
    await act(async () => closed.root.unmount());

    const open = await renderPage(true);
    expect(open.container.querySelector("input")).not.toBeNull();
    expect(open.container.querySelector('[aria-label="group"]')).not.toBeNull();
    await act(async () => open.root.unmount());
  });
});
