'use client';

import React from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';

export function MenuBar() {
  return (
    <Menubar className="border-b px-2">
      <MenubarMenu>
        <MenubarTrigger>Datei</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Neu <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Öffnen <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Speichern <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Bearbeiten</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Rückgängig <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Wiederholen <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Ausschneiden <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Kopieren <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Einfügen <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Ansicht</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Zoom In <MenubarShortcut>⌘+</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Zoom Out <MenubarShortcut>⌘-</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Timeline <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Media Browser <MenubarShortcut>⌘B</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}