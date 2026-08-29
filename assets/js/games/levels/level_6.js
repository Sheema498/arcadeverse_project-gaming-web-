/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 6
 * Procedurally defined layout vectors coordinates.
 */

const Level_6_Data = {
    id: 6,
    bg: '#11052c',
    grid: [
        "                                   C     C C                                       #               C^      C                                          ",
        "                     C  CE              #  #       E  C E C#  ^                 #                          #E  ^                         ^            ",
        "        #                 C   #   E       ^             #  E         ^    C            ##         C    E           C  #      C                        ",
        "     C          #            #             #                 #                          E# #              # #      C         #        C               ",
        "                #         C  CE#          ^    C     #        ##         E                 C  C         #    ##         ## C ##     #  #  ^           ",
        "      E #C        # E                                      #C  #                      #                    #              C#                          ",
        "                 E#C                  E   C            ^         C        E#            C   C   #              # C#       C                           ",
        "     ^                #     C           EE                #   ^             E#               #    ^                  #        ##    #                 ",
        "                 #    ^        C                ^  #            #          C                C         C    #                  #  C   E                ",
        "        # E        #                    E   # C  E                   #     ^        C                    #  # ^                                       ",
        "       #                # E                              E ##           ^EC    C#                              # #                    ^               ",
        "      C             #C C   C   C     #           #  #    ##            ^ E  #  C                     # #         #   E        E                       ",
        "            E    E      ^#               #   E C      CC              #            #     C                               C  E      #^      #          ",
        "  S     C          E                   E    E     #                       ###      C       #        E#    E           ^       ^       E  # #  Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_6_Data);
