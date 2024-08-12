import crypto from "crypto";
import etapi from "../support/etapi.js";

etapi.describeEtapi("notes", () => {
  it("create", async () => {
    const { note, branch } = await etapi.postEtapi("create-note", {
      parentNoteId: "root",
      type: "text",
      title: "Hello World!",
      content: "Content",
      prefix: "Custom prefix",
    });

    expect(note.title).toEqual("Hello World!");
    expect(branch.parentNoteId).toEqual("root");
    expect(branch.prefix).toEqual("Custom prefix");

    const rNote = await etapi.getEtapi(`notes/${note.noteId}`);
    expect(rNote.title).toEqual("Hello World!");

    const rContent = await (
      await etapi.getEtapiContent(`notes/${note.noteId}/content`)
    ).text();
    expect(rContent).toEqual("Content");

    const rBranch = await etapi.getEtapi(`branches/${branch.branchId}`);
    expect(rBranch.parentNoteId).toEqual("root");
    expect(rBranch.prefix).toEqual("Custom prefix");
  });

  it("patch", async () => {
    const { note } = await etapi.postEtapi("create-note", {
      parentNoteId: "root",
      type: "text",
      title: "Hello World!",
      content: "Content",
    });

    await etapi.patchEtapi(`notes/${note.noteId}`, {
      title: "new title",
      type: "code",
      mime: "text/apl",
      dateCreated: "2000-01-01 12:34:56.999+0200",
      utcDateCreated: "2000-01-01 10:34:56.999Z",
    });

    const rNote = await etapi.getEtapi(`notes/${note.noteId}`);
    expect(rNote.title).toEqual("new title");
    expect(rNote.type).toEqual("code");
    expect(rNote.mime).toEqual("text/apl");
    expect(rNote.dateCreated).toEqual("2000-01-01 12:34:56.999+0200");
    expect(rNote.utcDateCreated).toEqual("2000-01-01 10:34:56.999Z");
  });

  it("update content", async () => {
    const { note } = await etapi.postEtapi("create-note", {
      parentNoteId: "root",
      type: "text",
      title: "Hello World!",
      content: "Content",
    });

    await etapi.putEtapiContent(`notes/${note.noteId}/content`, "new content");

    const rContent = await (
      await etapi.getEtapiContent(`notes/${note.noteId}/content`)
    ).text();
    expect(rContent).toEqual("new content");
  });

  it("create / update binary content", async () => {
    const { note } = await etapi.postEtapi("create-note", {
      parentNoteId: "root",
      type: "file",
      title: "Hello World!",
      content: "ZZZ",
    });

    const updatedContent = crypto.randomBytes(16);

    await etapi.putEtapiContent(`notes/${note.noteId}/content`, updatedContent);

    const rContent = await (
      await etapi.getEtapiContent(`notes/${note.noteId}/content`)
    ).arrayBuffer();
    expect(Buffer.from(new Uint8Array(rContent))).toEqual(updatedContent);
  });

  it("delete note", async () => {
    const { note } = await etapi.postEtapi("create-note", {
      parentNoteId: "root",
      type: "text",
      title: "Hello World!",
      content: "Content",
    });

    await etapi.deleteEtapi(`notes/${note.noteId}`);

    const resp = await etapi.getEtapiResponse(`notes/${note.noteId}`);
    expect(resp.status).toEqual(404);

    const error = await resp.json();
    expect(error.status).toEqual(404);
    expect(error.code).toEqual("NOTE_NOT_FOUND");
    expect(error.message).toEqual(`Note '${note.noteId}' not found.`);
  });
});
